import JUSTC from 'justc';
import { name__, prefix } from '../lib/meta.js';

import { 
    stringCodes, 
    codesString,
    charCode,
    checkChar,
    stringChunks,
    chunkArray,
    decToBin,
    binToDec,
    B64Padding
} from '../lib/utils.js';
import { freqMap, freqMapSplitters } from './modes/freqMap.js';
import { segments, splitGraphemes } from './modes/segmentation.js';
import { _JSSC } from './encodings.js';
import { compressSequences, decompressSequences } from './sequences.js';
import { convertBase, URL as B64URL } from '../lib/third-party/convertBase.js';
import { compressB64, decompressB64 } from './modes/base64.js';
import { encode, decode } from '@strc/utf16-to-any-base';
import utf8 from "utf8"; const { eUTF8 } = (()=>{
    const { encode } = utf8;
    return { eUTF8: encode };
})();
import lz from 'lz-string'; const { cLZ, dLZ } = (()=>{
    const { compressToUTF16, decompressFromUTF16 } = lz;
    return { cLZ: compressToUTF16, dLZ: decompressFromUTF16 };
})();
import { runInWorkers, canUseWorkers, workerURL, workerMin } from './useWorker.js';
import { validateCache, setCache } from './cache.js';
import { compress as cAXOR, decompress as dAXOR } from './modes/axor.js';
import { B64toUI8A, UI8AtoB64 } from '../lib/uint8.js';

function cryptCharCode(
    code, get = false,
    repeatBefore = false, repeatAfter = false,
    beginId = -1, code2 = 0, sequences = false,
    code3 = -1
) {
    if (get) {
        const codeBin = decToBin(code, 16);
        const codeSet = codeBin.slice(8,11).split('');
        const codeDec = binToDec(codeBin.slice(11));
        const begid = binToDec(codeBin.slice(5,8));
        return {
            code: codeDec,
            repeatBefore: codeSet[0] === '1',
            repeatAfter: codeSet[1] === '1',
            beginId: codeSet[2] === '1' ? begid : -1,
            code2: binToDec(codeBin.slice(0,4)),
            sequences: codeBin.slice(4,5) === '1',
            code3: codeSet[2] === '0' ? begid : -1,
            bin: codeBin,
        }
    } else {
        const sixteenBits =                                               /* 16-bit Data/Header character */

            decToBin(code2, 4) +                                          /* Bits  0-3  :           code2 */
            (sequences ? '1' : '0') +                                     /* Bit    4   : sequences?|odd? */
            decToBin(beginId >= 0 ? beginId : code3 < 0 ? 0 : code3, 3) + /* Bits  5-7  : beginID | code3 */
            (repeatBefore ? '1' : '0') +                                  /* Bit    8   : inp RLE? | num? */
            (repeatAfter ? '1' : '0') +                                   /* Bit    9   :     output RLE? */
            (beginId >= 0 ? '1' : '0') +                                  /* Bit   10   :        beginID? */
            decToBin(code, 5);                                            /* Bits 11-15 :           code1 */
        
        return binToDec(sixteenBits);
    }
}

/*
     _________________________________________________________________________________________________
    | Name                             | Short name | Mode ID | Code #1 usage | Code #2 usage | Since |
    |----------------------------------|------------|---------|---------------|---------------|-------|
    | No Compression                   | NC         |       0 | 00            | 00            | 1.0.0 |
    | Two-Digit CharCode Concatenation | TDCCC      |       1 | 01            | 00            | 1.0.0 |
    | Two-Byte CharCode Concatenation  | TBCCC      |       2 | 02            | 00            | 1.0.0 |
    | Decimal Integer Packing          | DIP        |       3 | 03            | 00            | 1.0.0 |
    | Alphabet Encoding                | AE         |       4 | 04            | 00 - 15       | 1.1.0 |
    | Character Encoding               | CE         |       5 | 05            | 00 - 15       | 1.0.0 |
    | Inline Integer Encoding          | IIE        |       6 | 00 / 06       | 01 - 15       | 2.0.0 |
    | Frequency Map                    | FM         |       7 | 07            | 00 - 15       | 2.0.0 |
    | URL                              | URL        |       8 | 08            | 00 - 15       | 2.0.0 |
    | Segmentation                     | S          |       9 | 09            | 00 - 15       | 2.0.0 |
    | String Repetition                | SR         |      10 | 10            | 00 - 15       | 2.0.0 |
    | Recursive Compression            | RC         |      11 | 31            | 00 - 15       | 2.0.0 |
    | Emoji Packing                    | EP         |      12 | 11            | 00            | 2.1.0 |
    | Base-64 Integer Encoding         | B64IE      |      13 | 11            | 01            | 2.1.0 |
    | Base-64 Packing                  | B64P       |      14 | 12            | 00 - 15       | 2.1.0 |
    | Offset Encoding                  | OE         |      15 | 30            | custom layout | 2.1.0 |
    | lz-string                        | LZ         |      16 | 11            | 02            | 2.1.0 |
    | Chunkification                   | C          |      17 | 11            | 03            | 2.1.0 |
    | Adaptive XOR                     | AXOR       |      18 | 13            | 00 - 15       | 2.1.0 |
    |----------------------------------|------------|---------|---------------|---------------|-------|

*/

async function tryRecursive(base, opts) {
    if (!opts.recursivecompression) return base;

    let cur = base;
    let depth = 0;

    while (depth < 15) {
        depth++;
        const next = await compress(cur, {
            ...opts,
            recursivecompression: false,
            depth: opts.depth + 1
        });

        if (next.length >= cur.length) break;

        const dec = await decompress(next, true);
        if (dec !== cur) break;

        cur = next;
    }

    if (depth === 0) return null;

    return (
        charCode(
            cryptCharCode(
                31,
                false,
                false,
                false,
                -1,
                depth,
                false,
                -1
            )
        ) + cur
    );
}

function readOptions(options, defaults) {
    if (typeof options != 'object' || Array.isArray(options)) throw new Error(prefix+'Invalid options input.');
    for (const [key, value] of Object.entries(options)) {
        if ((key == 'depth' || key.toLowerCase() == 'depthlimit' || key == 'worker' || key.toLowerCase() == 'workerlimit') && typeof value == 'number') {
            defaults[key.toLowerCase()] = value;
            continue;
        }
        if (typeof value == 'undefined') continue;
        if (typeof value != 'boolean') throw new Error(prefix+'Invalid options input.');
        if (key.toLowerCase() in defaults) {
            defaults[key.toLowerCase()] = value;
            continue;
        }
        console.warn(prefix+`Unknown option: "${key}".`);
    }
    return defaults;
}

function getModeID(code1, code2) {
    switch (code1) {
        case 0:
            return code2 == 0 ? 0 : 6;
        case 11: {
            switch (code2) {
                case 0:
                    return 12;
                case 1:
                    return 13;
                case 2:
                    return 16;
                case 3:
                    return 17;
            }
        }
        case 12:
            return 14;
        case 13:
            return 18;
        case 30:
            return 15;
        case 31:
            return 11;
        default:
            return code1;
    }
}
class JSSC {
    constructor (com, dec, opts, m = 0, workers = false) {
        const headerchar = decToBin(com.charCodeAt(0), 16);
        const code1 = headerchar.slice(11);
        const code2 = headerchar.slice(0,4);
        const code3 = headerchar.slice(5,8);
        const s = headerchar.slice(4,5);
        const i = headerchar.slice(8,9);
        const o = headerchar.slice(9,10);
        const b = headerchar.slice(10,11);

        const compressed = {
            string: com,
            header: {
                code: binToDec(headerchar),
                bin: headerchar,
                blocks: [
                    code2,
                    s,
                    code3,
                    i,
                    o,
                    b,
                    code1
                ],
                code1, code2, code3,
                s: s == '1',
                i: i == '1',
                o: o == '1',
                b: b == '0'
            },
            mode: getModeID(binToDec(code1), binToDec(code2))
        }

        this.output = m == 0 ? compressed : dec;
        this.options = opts;
        this.input = m == 0 ? dec : compressed;
        this.workers = workers;
        Object.freeze(this);
    }
}

function offsetEncoding(string) {
    const group = Math.floor(stringCodes(string).minCharCode / 32);
    const offset = group * 32;
    const result = [];
    for (let i = 0; i < string.length; i++) {
        result.push(String.fromCharCode(string.charCodeAt(i) - offset));
    }
    const char = charCode(binToDec(decToBin(group, 11) + decToBin(30, 5)));
    return [result.join(''), char, group];
}
async function validateOffsetEncoding(string, inp, group) {
    try {
        return group > 0 && (
            eUTF8(string).length < eUTF8(inp).length ||
            encode(string).length < encode(inp).length ||
            (new TextEncoder()).encode(string).length < (new TextEncoder()).encode(inp).length ||
            opts.offsetencode
        ) && await validate(string);
    } catch (_) {
        return false;
    }
}

async function parseJUSTC(str) {
    try {
        const result = JUSTC.parse(str);

        if (result && typeof result.then === 'function') {
            return await result;
        }

        return result;
    } catch (err) {
        if (typeof window !== 'undefined') { /* Browsers */
            try {
                await JUSTC.initialize();

                const retry = JUSTC.parse(str);
                if (retry && typeof retry.then === 'function') {
                    return await retry;
                }

                return retry;
            } catch {
                return null;
            }
        }

        return null;
    }
}

/**
 * **JavaScript String Compressor - compress function.**
 * @param {string|object|number} input string
 * @param {{segmentation?: boolean, recursiveCompression?: boolean, JUSTC?: boolean, base64IntegerEncoding?: boolean, base64Packing?: boolean, offsetEncoding?: boolean, lzstring?: boolean, offsetEncode?: boolean, minifiedworker?: boolean, depthLimit?: number, workerLimit?: number, JSONstring?: boolean, debug?: boolean}} [options]
 * @returns {Promise<string>} Compressed string
 * @example await compress('Hello, World!');
 * @since 1.0.0
 */
export async function compress(input, options) {
    if (typeof input != 'string' && typeof input != 'object' && typeof input != 'number') throw new Error(prefix+'Invalid input.');
    let opts = {
        segmentation: true,
        recursivecompression: true,
        justc: JUSTC ? true : false,
        base64integerencoding: true,
        base64packing: true,
        offsetencoding: true,
        lzstring: true,
        
        offsetencode: false,
        minifiedworker: true,
        depthlimit: 10,
        workerlimit: 2,
        jsonstring: false,
        debug: false,

        depth: 0,
        worker: 0
    };

    /* Read options */
    if (options) opts = readOptions(options, opts);
    if (opts.depth >= opts.depthlimit) throw new Error('');

    const originalInput = input;
    let str = input;
    let isNum = false;

    if (typeof str === 'number') {
        isNum = true;
        str = str.toString();
        if (str.includes('.')) throw new Error(prefix+'Invalid input.');
    }

    let repeatBefore = false;
    function repeatChars(txt) {
        return txt.replace(/(.)\1+/g, ( a , b ) => b + a.length);
    }

    let beginId = -1;
    if (typeof str == 'string') for (const begin of _JSSC._begin) {
        if (str.startsWith(begin)) {
            beginId = _JSSC._begin.indexOf(begin);
            str = str.slice(begin.length);
            break;
        }
    };

    let code3 = -1;
    async function toJUSTC(obj) {
        try {
            const result = await JUSTC.stringify(obj);
            if (result && typeof result.then === 'function') {
                return await result;
            }
            return result;
        } catch (_) {
            /* Browsers */
            await JUSTC.initialize();
            return JUSTC.stringify(obj);
        }
    }
    if (beginId == -1) {
        /* JSON Array (as object) */
        if (typeof str == 'object' && Array.isArray(str)) {
            str = JSON.stringify(str).slice(1,-1);
            code3 = 4;
        } else
        /* JSON Object (as object) */
        if (typeof str == 'object') try {
            let JUSTCstr = undefined;
            if (opts.justc) {
                const JUSTCobj = await toJUSTC(str);
                const JSONstr = JSON.stringify(await parseJUSTC(JUSTCobj));
                if (JSONstr == JSON.stringify(str)) JUSTCstr = JUSTCobj;
            }

            if (typeof JUSTCstr != 'undefined') {
                str = JUSTCstr;
                code3 = 2;
            } else {
                str = JSON.stringify(str);
                code3 = 6;
            }
        } catch (error) {
            const msg = new Error(prefix+'Invalid input.');
            throw new AggregateError([msg, error], msg.message);
        } else
        /* JSON Object (as string) */
        try {
            const obj = JSON.parse(str);
            if (!Array.isArray(obj) && typeof obj == 'object') {
            
            let JUSTCstr = undefined;
            if (opts.justc && opts.jsonstring) {
                const JUSTCobj = await toJUSTC(obj);
                const JSONstr = JSON.stringify(await parseJUSTC(JUSTCobj));
                if (JSONstr == JSON.stringify(obj)) JUSTCstr = JUSTCobj;
            }

            if (typeof JUSTCstr != 'undefined' && JUSTCstr.length < str.length && str == JSON.stringify(obj)) {                
                str = JUSTCstr;
                code3 = 1;
            } else {
                str = str.slice(1,-1);
                code3 = 5;
            }
        } else if (typeof obj == 'object' && Array.isArray(obj)) {
        /* JSON Array (as string) */
        str = str.slice(1,-1);
        code3 = 3;
        }} catch (_) {
    }}

    if (!/\d/.test(str)) {
        str = repeatChars(str);
        repeatBefore = true;
    }
    
    function processOutput(output, disableSeq = false) {
        let repeatAfter = false;
        let sequences = false;

        const hasDigits = /\d/.test(output);
        if (!hasDigits) {
            repeatAfter = true;
            output = repeatChars(output);
        }
        
        if (!disableSeq) {
            const compressed = compressSequences(output);
            if (compressed.sequences) {
                sequences = true;
                return [compressed.compressed, repeatAfter, sequences];
            }
        }
        
        return [output, repeatAfter, sequences];
    }

    const safeTry = async (fn) => {
        try {
            return await fn();
        } catch (err) {
            if (opts.debug) console.warn(err);
            return null;
        }
    };

    const validate = async (compressed) => {
        try {
            const dec = await decompress(compressed, true);
            return dec === String(originalInput);
        } catch {
            return false;
        }
    };

    let results;
    const context = {
        opts,
        str, isNum, code3, originalInput,
        beginId, repeatBefore
    };
    const candidates = [
        IIE,
        DIP,
        B64IE,
        TDCCC,
        TBCCC,
        CE,
        AE,
        FM,
        URL_,
        S,
        SR,
        EP,
        B64P,
        OE,
        LZS,
        AXOR
    ];
    async function noWorkers() {
        return await Promise.all(candidates.map(fn => safeTry(async () => await fn(context))));
    }

    let usedWorkers = false;
    if (!(opts.worker > opts.workerlimit) && originalInput.length > 64 && await canUseWorkers()) {
        try {
            usedWorkers = true;
            results = await runInWorkers(
                candidates.map(fn => fn.name), 
                context, 
                customWorkerURL != null && typeof customWorkerURL != 'undefined' ? customWorkerURL
                : opts.minifiedworker ? workerMin : workerURL
            );
        } catch (err) {
            if (opts.debug) console.warn(err);
        }
    } else results = await noWorkers();

    if (usedWorkers && (
        !Array.isArray(results) ||
        results.length == 0 ||
        results.every(c => c == null)
    )) {
        results = await noWorkers();
        usedWorkers = false;
    }

    results = results.filter(r => typeof r === 'string' && r.length <= String(originalInput).length);

    let best;
    if (!results.length) {
        let [repeatAfter, sequences] = [false, false];
        const savedStr = str;
        [str, repeatAfter, sequences] = processOutput(str);
        if (await validate(str)) best = charCode(cryptCharCode(0, false, repeatBefore, repeatAfter, beginId, 0, sequences, code3)) + str;
        else best = charCode(cryptCharCode(0, false, repeatBefore, false, beginId, 0, false, code3)) + savedStr;
    } else best = results.reduce((a, b) => (b.length < a.length ? b : a));

    if (opts.recursivecompression) try {
        for (const r of results) {
            const rc = await tryRecursive(r, opts);
            if (rc && rc.length <= best.length && await validate(rc)) {
                best = rc;
            }
        }
    } catch (_){};

    /* postprocessing */
    if (opts.offsetencoding) {
        const enc = offsetEncoding(best);
        const res = enc[1] + enc[0];
        if (await validateOffsetEncoding(res, best, enc[2])) best = res;
    }

    if (opts.debug) return new JSSC(best, originalInput, opts, 0, usedWorkers);

    return best;
}

function characterEncodings(id, realstr) {
    const strcode2charencoding = {};
    for (const [name, code] of Object.entries(_JSSC._IDs)) {
        strcode2charencoding[code] = name
    }
    const possibleCharEncoding = strcode2charencoding[id];
    if (possibleCharEncoding) {
        const characterEncodings_ = new _JSSC.use();
        const characterEncoding = characterEncodings_[name__+possibleCharEncoding]();
        const output = [];
        for (let i = 0; i < realstr.length; i++) {
            const characterCode = realstr.charCodeAt(i);
            const binCode0 = decToBin(characterCode, 0);
            function binCodeToChar(charr) {
                return String(characterEncoding[String(binToDec(charr))]);
            }
            if (binCode0.length > 8) {
                const [character1, character2] = stringChunks(decToBin(characterCode, 16), 8);
                output.push(binCodeToChar(character1) + binCodeToChar(character2));
            } else {
                const character = decToBin(characterCode, 8);
                output.push(binCodeToChar(character));
            }
        }
        return output.join('');
    }
}

function offsetDecoding(str, group) {
    const offset = group * 32;
    const result = [];
    
    for (let i = 0; i < str.length; i++) {
        result.push(String.fromCharCode(str.charCodeAt(i) + offset));
    }
    
    return result.join('');
}

/**
 * **JavaScript String Compressor - decompress function.**
 * @param {string} str Compressed string
 * @param {boolean | {stringify?: boolean, debug?: boolean}} [stringify] Return only string in any way
 * @returns {Promise<string|object|number>} Decompressed string/object/integer
 * @since 1.0.0
 */
export async function decompress(str, stringify = false) {
    if (typeof str != 'string') throw new Error(prefix+'Invalid input.');
    const s = str;
    let opts = {
        stringify: false,

        debug: false
    }

    /* Read options */
    switch (typeof stringify) {
        case 'boolean':
            opts.stringify = stringify;
            break;
        case 'object':
            opts = readOptions(stringify, opts);
            break;
        default:
            opts.stringify = Boolean(stringify);
            break;
    }

    const charcode = (str.charCodeAt(0) - 32 + 65535) % 65535;
    const strcodes = cryptCharCode(charcode, true);
    const strcode = strcodes.code;
    
    function repeatChars(txt) {
        return txt.replace(/(\D)(\d+)/g, (_, g1, g2) => g1.repeat(g2));
    }
    
    /* sequences */
    let realstr = str.slice(1);
    if (strcodes.sequences && ![8,9,13,30].includes(strcode)) {
        realstr = decompressSequences(realstr);
    }
    
    /* RLE */
    if (strcodes.repeatAfter && ![9,13,30].includes(strcode)) {
        realstr = repeatChars(realstr);
    }
    
    async function begin(out) {
        if (strcodes.beginId >= 0) {
            return _JSSC._begin[strcodes.beginId] + out;
        } else if (strcodes.code3 == 1 || strcodes.code3 == 2) {
            /* JSON Object */
            const result = await parseJUSTC(out);
            if (result && typeof result.then === 'function') {
                return JSON.stringify(await result);
            } else return JSON.stringify(result);
        } else return out;
    }
    
    function checkOutput(out) {
        if (opts.debug) return new JSSC(s, out, opts, 1);
        return out;
    }
    async function processOutput(out, checkOut = true) {
        let output = out;

        if (strcodes.repeatBefore && strcode != 3 && strcode != 12) {
            output = repeatChars(await begin(out));
        } else output = await begin(out);

        if ((strcodes.repeatBefore && (strcode == 3 || strcode == 12)) || strcode == 30) output = parseInt(output); else { /*            Integer            */
        if (strcodes.code3 == 3 || strcodes.code3 == 4) output = '[' + output + ']';                                       /*          JSON  Array          */
        else if (strcodes.code3 == 5) output = '{' + output + '}';                                                         /*    JSON Object (as string)    */
        if (strcodes.code3 == 2 || strcodes.code3 == 4 || strcodes.code3 == 6) output = JSON.parse(output);}               /* JSON Object/Array (as object) */

        if (opts.stringify) {
            if (typeof output == 'object') output = JSON.stringify(output);
            else if (typeof output == 'number') output = output.toString();
        }

        return checkOut ? checkOutput(output) : output;
    }
    
    const output = [];
    switch (strcode) {
        case 0: case 6:
            if (strcodes.code2 > 0) return await processOutput(String(strcodes.code2 - 1)); /* Inline Integer Encoding */
            return await processOutput(realstr); /* No Compression */
        case 1: /* Two-Digit CharCode Concatenation */
            function addChar(cde) {
                output.push(String.fromCharCode(cde));
            }
            for (let i = 0; i < realstr.length; i++) {
                const char = realstr.charCodeAt(i);
                const charcde = String(char);
                if (charcde.length > 2) {
                    const charcds = stringChunks(charcde, 2);
                    for (const chrcode of charcds) {
                        addChar(parseInt(chrcode));
                    }
                } else {
                    addChar(char);
                }
            }
            return await processOutput(output.join(''));
        case 2: /* Two-Byte CharCode Concatenation */
            function toChar(binCode) {
                return String.fromCharCode(binToDec(binCode));
            }
            for (let i = 0; i < realstr.length; i++) {
                const char = realstr.charCodeAt(i);
                const binCode = decToBin(char, 16);
                const binCode0 = decToBin(char, 0);
                if (binCode0.length > 8) {
                    const [bin1, bin2] = stringChunks(binCode, 8);
                    output.push(toChar(bin1) + toChar(bin2));
                } else {
                    const binCode8 = decToBin(char, 8);
                    output.push(toChar(binCode8));
                }
            }
            return await processOutput(output.join(''));
        case 3: /* Decimal Integer Packing */
            for (let i = 0; i < realstr.length; i++) {
                const char = realstr.charCodeAt(i);
                const binCodes = stringChunks(decToBin(char, 16), 4);
                for (const binCode of binCodes) {
                    const numm = binToDec(binCode);
                    if (numm != 15) {
                        output.push(numm.toString(10));
                    }
                }
            }
            return await processOutput(output.join(''));
        case 4: /* Alphabet Encoding */
            const chars = [];
            for (let i = 0; i < realstr.slice(0, strcodes.code2).length; i++) {
                chars.push(realstr[i]);
            }
            for (let i = 0; i < realstr.slice(strcodes.code2).length; i++) {
                const binCodes = stringChunks(decToBin(realstr.charCodeAt(i), 16), 4);
                for (const binCode of binCodes) {
                    if (binCode != '1111') {
                        const numm = binToDec(binCode);
                        output.push(chars[numm]);
                    }
                }
            }
            return await processOutput(output.join(''));
        case 5: /* Character Encoding */
            const decoded = characterEncodings(strcodes.code2, realstr);
            if (decoded) {
                return await processOutput(decoded);
            } else throw new Error(prefix+'Invalid compressed string');
        case 7: /* Frequency Map */
            const splitter = freqMapSplitters[binToDec(decToBin(strcodes.code2).slice(1))];
            let output_ = freqMap.decompress(realstr, splitter);
            if (parseInt(decToBin(strcodes.code2).slice(0,1)) == 1) output_ = output_.slice(0,-1);
            return await processOutput(output_);
        case 8: { /* URL */
            let bytes = [];
            for (const ch of realstr) {
                const c = ch.charCodeAt(0);
                bytes.push((c >> 8) & 0xFF, c & 0xFF);
            }
            if (strcodes.sequences) bytes.pop();

            let out = [];
            for (const b of bytes) {
                out.push(String.fromCharCode(b));
            }
            out = out.join('');

            /* percent restore if needed */
            if (strcodes.code2 & 1) {
                out = out.replace(
                    /[\x00-\x20\x7F-\xFF]/g,
                    c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
                );
            }

            /* punycode restore */
            if (strcodes.code2 & 2 && typeof punycode !== 'undefined') {
                const u = new URL(out);
                u.hostname = punycode.toASCII(u.hostname);
                out = u.href;
            }

            return await processOutput(out);}
        case 9: { /* Segmentation */
            let idx = 0;
            const segCount = strcodes.code2 < 15 ? strcodes.code2 + 2 : realstr.charCodeAt(idx++) + 2;

            for (let i = 0; i < segCount; i++) {
                const len = realstr.charCodeAt(idx++);
                const segmentCompressed = realstr.slice(idx);

                const seg = (await decompress(
                    segmentCompressed, true
                )).slice(0, len);

                output.push(seg);
                idx += (await compress(seg, {segmentation: false, justc: strcodes.repeatAfter, recursivecompression: strcodes.sequences})).length;
            }

            return await processOutput(output.join(''));}
        case 10: /* String Repetition */
            const sliceChar = strcodes.code2 == 15;
            const repeatCount = sliceChar ? realstr.charCodeAt(0) + 15 : strcodes.code2;
            if (sliceChar) realstr = realstr.slice(1);
            return await processOutput(realstr.repeat(repeatCount));
        case 11: {
            switch (strcodes.code2) {
                case 0: { /* Emoji Packing */
                    const base = 0x1F300;

                    let bits = [];

                    for (let i = 0; i < realstr.length; i++) {
                        const code = realstr.charCodeAt(i);
                        bits.push(code.toString(2).padStart(16, '0'));
                    }
                    bits = bits.join('');

                    let pos = 0;
                    
                    while (pos + 3 <= bits.length) {
                        const length = parseInt(bits.slice(pos, pos + 3), 2);
                        pos += 3;

                        if (length === 0) break;

                        if (pos + (length * 11) > bits.length) break;

                        const cluster = [];

                        for (let i = 0; i < length; i++) {
                            const delta = parseInt(bits.slice(pos, pos + 11), 2);
                            pos += 11;

                            const cp = base + delta;
                            cluster.push(String.fromCodePoint(cp));
                        }

                        output.push(cluster.join(''));
                    }

                    return checkOutput(output.join(''));
                }
                case 1: { /* Base-64 Integer Encoding */
                    return checkOutput(await decompress(
                        await processOutput(convertBase(realstr, 64, 10), false)
                    ));
                }
                case 2: { /* lz-string */
                    return await processOutput(dLZ(realstr));
                }
                case 3: { /* Chunkification */
                    let i = 0;
                    while (i < realstr.length) {
                        const length = realstr.charCodeAt(i) + i;
                        i++;
                        output.push(await decompress(realstr.slice(i, length)));
                    }
                    return checkOutput(output.join(''));
                }
                default: throw new Error(prefix+'Invalid compressed string');
            }
        }
        case 12: /* Base-64 Packing */
            let len = strcodes.code2;
            let slice = len == 16;
            if (slice) len = realstr.slice(0,1).charCodeAt(0) + 16;
            return await processOutput(decompressB64(slice ? realstr.slice(1) : realstr, len));
        case 13: /* Adaptive XOR */
            return await processOutput(dAXOR(realstr, strcodes.code2));
        case 30: /* Offset Encoding */
            const dec = offsetDecoding(realstr, binToDec(decToBin(charcode, 16).slice(0,11)));
            return checkOutput(await decompress(dec));
        case 31: { /* Recursive Compression */
            let out = realstr;
            const depth = strcodes.code2;

            for (let i = 0; i < depth; i++) {
                const first = out.charCodeAt(0) - 32;
                const meta = cryptCharCode(first, true);

                if (meta.code === 31) {
                    throw new Error(prefix+'Attempt to nested recursive compression');
                }

                out = await decompress(out, true);
            }

            return checkOutput(out);
        }
        default:
            throw new Error(prefix+'Invalid compressed string');
    }
}

function noDebugMode(result) {
    if (result instanceof JSSC) throw new Error(prefix+'Invalid options input.');
    return result;
}

export async function compressToBase64(...input) {
    const compressed = noDebugMode(await compress(...input));
    return B64Padding(encode(compressed));
}
export async function decompressFromBase64(base64, ...params) {
    return noDebugMode(await decompress(decode(base64.replace(/=+$/, '')), ...params));
}

export async function compressToBase64URL(...input) {
    const compressed = noDebugMode(await compress(...input));
    return encode(compressed, 64, B64URL);
}
export async function decompressFromBase64URL(base64url, ...params) {
    return noDebugMode(await decompress(decode(base64url, 64, B64URL), ...params));
}

export async function compressToUint8Array(...input) {
    const compressed = await compressToBase64(...input);
    return B64toUI8A(compressed.replace(/=+$/, ''));
}
export async function decompressFromUint8Array(uint8array, ...params) {
    return await decompressFromBase64(UI8AtoB64(uint8array), ...params);
}

export async function compressLarge(input, ...params) {
    const LENGTH = 1024;
    if (input.length < LENGTH || typeof input != 'string') return await compress(input, ...params);

    const result = [charCode(cryptCharCode(11, false, false, false, undefined, undefined, false, 3))];
    
    for (let i = 0; i < input.length; i += LENGTH) {
        const chunk = input.slice(i, i + LENGTH);
        const compressed = noDebugMode(await compress(chunk, ...params));
        result.push(String.fromCharCode(compressed.length), compressed);
    }

    return result.join('');
}
export async function compressLargeToBase64(...input) {
    const compressed = await compressLarge(...input);
    return B64Padding(encode(compressed));
}
export async function compressLargeToBase64URL(...input) {
    const compressed = await compressLarge(...input);
    return encode(compressed, 64, B64URL);
}
export async function compressLargeToUint8Array(...input) {
    const compressed = await compressLargeToBase64(...input);
    return B64toUI8A(compressed.replace(/=+$/, ''));
}

async function validate(compressed, originalInput) {
    const cached = validateCache.get(compressed);
    if (typeof cached == 'boolean') return cached;

    let result;

    if (compressed.length > (originalInput.length + 1)) result = false;
    else try {
        const dec = await decompress(compressed, true);
        result = dec === String(originalInput);
    } catch {
        result = false;
    };
    
    setCache(compressed, result);
    return result;
}
const n = /^\d+$/;
function repeatChars(txt) {
    return txt.replace(/(.)\1+/g, ( a , b ) => b + a.length);
}
function processOutput(output, disableSeq = false) {
    let repeatAfter = false;
    let sequences = false;

    const hasDigits = /\d/.test(output);
    if (!hasDigits) {
        repeatAfter = true;
        output = repeatChars(output);
    }
    
    if (!disableSeq) {
        const compressed = compressSequences(output);
        if (compressed.sequences) {
            sequences = true;
            return [compressed.compressed, repeatAfter, sequences];
        }
    }
    
    return [output, repeatAfter, sequences];
}

/**
 * Inline Integer Encoding
 */
export async function IIE(context){
    const {str, isNum, code3, originalInput} = context;
    if (!n.test(str)) return null;

    const out = await (async () => {
        const num = parseInt(str);
        if (num < 15) {
            return charCode(
                cryptCharCode(isNum ? 6 : 0, false, false, false, -1, num + 1, false, code3)
            );
        }
        return null;
    })();
    if (!out) return null;
    if (!(await validate(out, originalInput))) return null;
    return out;
}

/**
 * Decimal Integer Packing
 */
export async function DIP(context) {
    const {str, isNum, code3, originalInput} = context;
    if (!n.test(str)) return null;

    const convertNums = {
        'A': 10,
        'B': 11,
        'C': 12,
        'D': 13,
        'E': 14
    };
    const inputt = str
        .replaceAll('10', 'A')
        .replaceAll('11', 'B')
        .replaceAll('12', 'C')
        .replaceAll('13', 'D')
        .replaceAll('14', 'E');
    const binOut = [];
    for (let i = 0; i < inputt.length; i++) {
        const character = inputt[i];
        if (/\d/.test(character)) {
            binOut.push(decToBin(parseInt(character), 4));
        } else {
            binOut.push(decToBin(convertNums[character], 4));
        }
    };
    let [output, RLE, sequences] = [[], false, false];
    function binPadStart(bin) {
        if (bin.length < 16) {
            const numm = 4 - stringChunks(bin, 4).length;
            return decToBin(15, 4).repeat(numm)+bin;
        } else return bin;
    }
    for (const character of chunkArray(binOut, 4)) {
        output.push(String.fromCharCode(binToDec(binPadStart(character.join('')))));
    }
    output = output.join('');
    [output, RLE, sequences] = processOutput(output);
    output = charCode(cryptCharCode(3, false, isNum, RLE, -1, 0, sequences, code3)) + output;
    if (!(await validate(output, originalInput))) return null;
    return output;
}

/**
 * Base-64 Integer Encoding
 */
export async function B64IE(context) {
    const {str, isNum, code3, originalInput, opts} = context;
    if (!n.test(str) || !opts.base64integerencoding) return null;

    let [output, RLE, seq] = processOutput(convertBase(str, 10, 64));
    output = await compress(output, {
        JUSTC: false,
        segmentation: false,
        recursiveCompression: false,
        base64IntegerEncoding: false,
        depth: opts.depth + 1,
    });
    output = charCode(cryptCharCode(11, false, isNum, RLE, -1, 1, seq, code3)) + output;
    if (!(await validate(output, originalInput))) return null;
    return output;
}

/**
 * Two-Digit CharCode Concatenation
 */
export async function TDCCC(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const strdata = stringCodes(str);
    if (!(strdata.max === 2 && strdata.min === 2)) return null;

    let chars = strdata.output;
    let [output, repeatAfter, seq] = [[], false, false];
    function addChar(codee) {
        output.push(String.fromCharCode(codee));
    }
    function sliceChars(numbr) {
        chars = chars.slice(numbr);
    }
    while (chars.length > 0) {
        if (chars.length === 1) {
            addChar(chars[0]);
            sliceChars(1);
        } else if (chars.length < 3) {
            for (const char of chars) {
                addChar(char);
            }
            sliceChars(chars.length)
        } else {
            const a1 = parseInt(String(chars[0]) + String(chars[1]) + String(chars[2]));
            const a2 = parseInt(String(chars[0]) + String(chars[1]));
            if (checkChar(a1)) {
                addChar(a1);
                sliceChars(3)
            } else if (checkChar(a2)) {
                addChar(a2);
                sliceChars(2)
            } else {
                addChar(chars[0]);
                sliceChars(1)
            }
        }
    }
    output = output.join('');
    [output, repeatAfter, seq] = processOutput(output);
    const res = charCode(cryptCharCode(1, false, repeatBefore, repeatAfter, beginId, 0, seq, code3)) + output;
    if (!(await validate(res, originalInput))) return null;
    return res;
}

/**
 * Two-Byte CharCode Concatenation
 */
export async function TBCCC(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const strdata = stringCodes(str);
    if (strdata.maxCharCode >= 256) return null;

    let [out, repeatAfter, seq] = [[], false, false];
    for (const pair of stringChunks(str, 2)) {
        const bin = [];
        for (const c of pair) bin.push(decToBin(c.charCodeAt(0), 8));
        out.push(String.fromCharCode(binToDec(bin.join(''))));
    }
    out = out.join('');

    [out, repeatAfter, seq] = processOutput(out);
    const res = charCode(cryptCharCode(2, false, repeatBefore, repeatAfter, beginId, 0, seq, code3)) + out;
    if (!(await validate(res, originalInput))) return null;
    return res;
}

/**
 * Character Encoding
 */
export async function CE(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const characterEncodings = new _JSSC.use();
    let useCharacterEncoding;
    let charEncodingID = NaN;
    
    for (const [characterEncodingName, characterEncoding] of Object.entries(characterEncodings)) {
        const table = characterEncoding();
        table.length = 256;
        const arrayy = Array.from(table);
        let usethisone = true;
        for (let i = 0; i < str.length; i++) {
            if (!arrayy.includes(str[i])) {
                usethisone = false;
                break;
            }
        }
        if (usethisone) {
            useCharacterEncoding = characterEncoding();
            charEncodingID = _JSSC._IDs[characterEncodingName.slice(4)];
            break;
        }
    }
    
    if (useCharacterEncoding) {
        const reverseCharacterEncoding = {};
        for (const [charCode, character] of Object.entries(useCharacterEncoding)) {
            reverseCharacterEncoding[character] = charCode;
        }
        const binaryCharCodes = [];
        const convertCharCodes = [];
        for (let i = 0; i < str.length; i++) {
            binaryCharCodes.push(decToBin(parseInt(reverseCharacterEncoding[str[i]]), 8));
        }
        for (const binCharCodes of chunkArray(binaryCharCodes, 2)) {
            convertCharCodes.push(binCharCodes.join('').padStart(16, '0'));
        }
        let [outputStr, repeatAfter, seq] = [[], false, false];
        for (const characterCode of convertCharCodes) {
            outputStr.push(String.fromCharCode(binToDec(characterCode)));
        }
        outputStr = outputStr.join('');

        [outputStr, repeatAfter, seq] = processOutput(outputStr);
        outputStr = charCode(cryptCharCode(5, false, repeatBefore, repeatAfter, beginId, charEncodingID, seq, code3)) + outputStr;
        if (await validate(outputStr, originalInput)) return outputStr;
    }
    return null;
}

/**
 * Alphabet Encoding
 */
export async function AE(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const uniq = [...new Set(str.split('').map(c => c.charCodeAt(0)))];
    if (uniq.length >= 16) return null;

    let out = [uniq.map(c => String.fromCharCode(c)).join('')];
    let buf = [];
    let [repeatAfter, seq] = [false, false];

    for (const c of str) {
        buf.push(uniq.indexOf(c.charCodeAt(0)));
        if (buf.length === 4) {
            out.push(String.fromCharCode(binToDec(buf.map(n => decToBin(n, 4)).join(''))));
            buf = [];
        }
    }

    if (buf.length) {
        out.push(String.fromCharCode(
            binToDec(buf.map(n => decToBin(n, 4)).join('').padStart(16, '1'))
        ));
    }

    [out, repeatAfter, seq] = processOutput(out.join(''));
    const res = charCode(cryptCharCode(4, false, repeatBefore, repeatAfter, beginId, uniq.length, seq, code3)) + out;
    if (!(await validate(res, originalInput))) return null;
    return res;
}

/**
 * Frequency Map
 */
export async function FM(context) {
    const {str, originalInput} = context;

    for (const splitter of freqMapSplitters) {
        const test = freqMap.test(str, splitter);
        if (!Array.isArray(test)) continue;

        const [, , sp, packed] = test;
        const code2 = binToDec((test[0] - 1).toString() + decToBin(freqMapSplitters.indexOf(sp), 3));
        const res = charCode(cryptCharCode(7, false, false, false, -1, code2)) + packed;

        if (await validate(res, originalInput)) return res;
    }
    return null;
}

/*
 * URL
 */
export async function URL_(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    if (typeof str !== 'string') return null;

    let url;
    try {
        url = new URL(_JSSC._begin[beginId] + str);
    } catch {
        return null;
    }

    const originalHref = url.href;

    let hasPercent = /%[0-9A-Fa-f]{2}/.test(originalHref);
    let hasPunycode = url.hostname.includes('xn--');
    let hasQuery = !!url.search;
    let hasFragment = !!url.hash;

    /* normalize */
    let normalized = originalHref.slice(_JSSC._begin[beginId].length);

    /* punycode to unicode */
    if (hasPunycode && typeof punycode !== 'undefined') {
        url.hostname = punycode.toUnicode(url.hostname);
        normalized = url.href.slice(_JSSC._begin[beginId].length);
    }

    /* percent to bytes */
    let bytes = [];
    for (let i = 0; i < normalized.length; i++) {
        const ch = normalized[i];
        if (ch === '%' && i + 2 < normalized.length) {
            const hex = normalized.slice(i + 1, i + 3);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
                bytes.push(parseInt(hex, 16));
                i += 2;
                continue;
            }
        }
        bytes.push(normalized.charCodeAt(i));
    }
    
    let odd = bytes.length & 1;
    if (odd) bytes.push(0);

    /* bytes to UTF16 */
    let out = [];
    for (let i = 0; i < bytes.length; i += 2) {
        out.push(String.fromCharCode(
            (bytes[i] << 8) | (bytes[i + 1] ?? 0)
        ));
    }

    let code2 =
        (hasPercent ? 1 : 0) |
        (hasPunycode ? 2 : 0) |
        (hasQuery ? 4 : 0) |
        (hasFragment ? 8 : 0);

    let repeatAfter = false;
    [out, repeatAfter,] = processOutput(out.join(''), true);

    const res =
        charCode(
            cryptCharCode(
                8,
                false,
                repeatBefore,
                repeatAfter,
                beginId,
                code2,
                odd,
                code3
            )
        ) + out;

    if (!(await validate(res, originalInput))) return null;
    return res;
}

/*
 * Segmentation
 */
export async function S(context) {
    const {str, code3, repeatBefore, beginId, opts, originalInput} = context;

    const segs = segments(str);

    if (segs.length < 2) return null;

    const out = [segs.length - 2 < 15 ? '' : String.fromCharCode(segs.length - 2)];

    for (const seg of segs) {
        const segOpts = {
            ...opts,
            segmentation: false,
            depth: opts.depth + 1
        }
        const compressed = await compress(seg, segOpts);

        out.push(String.fromCharCode(seg.length));
        out.push(compressed);
    }

    const res =
        charCode(
            cryptCharCode(
                9,
                false,
                repeatBefore,
                opts.justc,
                beginId,
                Math.min(segs.length - 2, 15),
                opts.recursivecompression,
                code3
            )
        ) + out.join('');

    if (!(await validate(res, originalInput))) return null;
    return res;
}

/*
 * String Repetition
 */
export async function SR(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const rcheck = str.match(/^(.{1,7}?)(?:\1)+$/);
    if (!rcheck) return null;

    const main = rcheck[1];
    const count = str.length / main.length;
    if (Math.floor(count) != count || count < 1 || count > 65535 + 15) return null;
    let [out, repeatAfter, seq] = ['', false, false];
    [out, repeatAfter, seq] = processOutput(main);

    const res =
        charCode(
            cryptCharCode(
                10,
                false,
                repeatBefore,
                repeatAfter,
                beginId,
                Math.min(count - 1, 15),
                seq,
                code3
            )
        ) + (
            (count - 1) > 14 ? String.fromCharCode(count - 15) : ''
        ) + out;

    if (!(await validate(res, originalInput))) return null;
    return res;
}

/**
 * Emoji Packing
 */
export async function EP(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;

    const graphemes = splitGraphemes(str);
    function isEmojiCluster(cluster) {
        const code = cluster.codePointAt(0);
        return (code >= 0x1F300 && code <= 0x1FAFF);
    }
    
    if (!graphemes.every(isEmojiCluster)) return null;

    const base = 0x1F300;
    const bits = [];

    for (const g of graphemes) {
        const cps = Array.from(g).map(c => c.codePointAt(0));
        bits.push(decToBin(cps.length, 3));
        for (const cp of cps) {
            bits.push(decToBin(cp - base, 11));
        }
    }

    const out = [];
    for (const chunk of stringChunks(bits.join(''), 16)) {
        out.push(String.fromCharCode(binToDec(chunk.padEnd(16,'0'))));
    }

    const [outPostprocessed, repeatAfter, seq] = processOutput(out.join(''));

    function hchar(ra = false, sq = false) {
        return cryptCharCode(11, false, repeatBefore, ra, beginId, 0, sq, code3);
    }
    const resA = charCode(hchar(repeatAfter, seq)) + outPostprocessed;
    const resB = charCode(hchar()) + out;

    if (await validate(resA, originalInput)) return resA;
    if (await validate(resB, originalInput)) return resB;
    return null;
}

/**
 * Base-64 Packing
 */
export async function B64P(context) {
    const {str, code3, repeatBefore, beginId, opts, originalInput} = context;

    if (!(/^[0-9a-zA-Z+/]+$/.test(str) && opts.base64packing)) return null;
    
    const { data, length } = compressB64(str);

    let len = '';
    if (length > 14) {
        const lng = length - 15
        if (lng > 0xFFFF) return null;
        len = String.fromCharCode(lng);
    }

    const res = charCode(cryptCharCode(12, false, repeatBefore, false, beginId, Math.min(length, 15), false, code3)) + len + data;
    if (await validate(res, originalInput)) return res;
    return null;
}

/* 
 * Offset Encoding
 */
export async function OE(context) {
    const {originalInput, opts} = context;
    if (!opts.offsetencoding) return null;

    const enc = offsetEncoding(originalInput);
    const res = enc[1] + await compress(enc[0], {
        ...opts,
        offsetencoding: false,
        depth: opts.depth + 1
    });
    if (await validateOffsetEncoding(res, originalInput, enc[2])) return res;
    return null;
}

/*
 * lz-string
 */
export async function LZS(context) {
    const {str, code3, repeatBefore, beginId, opts, originalInput} = context;
    if (!opts.lzstring) return null;
    const res = charCode(cryptCharCode(11, false, repeatBefore, false, beginId, 2, false, code3)) + cLZ(str);
    if (await validate(res, originalInput)) return res;
    return null;
}

/*
 * Adaptive XOR
 */
export async function AXOR(context) {
    const {str, code3, repeatBefore, beginId, originalInput} = context;
    const [compressed, mode] = cAXOR(str);
    const res = charCode(cryptCharCode(13, false, repeatBefore, false, beginId, mode, false, code3)) + compressed;
    if (await validate(res, originalInput)) return res;
    return null;
}

let customWorkerURL = null;
export function setWorkerURL(url) {
    if (
        (typeof url != 'string' && typeof url != 'object' && typeof url != 'undefined') ||
        (
            typeof url == 'string' && (()=>{
                try {
                    new URL(url);
                    return false;
                } catch {
                    return true;
                }
            })()
        )
    ) throw new Error(prefix+'invalid URL.');
    customWorkerURL = url;
}
export function getWorkerURL() {
    if (typeof customWorkerURL == 'string' || typeof customWorkerURL == 'object') return customWorkerURL;
    return workerURL;
}
