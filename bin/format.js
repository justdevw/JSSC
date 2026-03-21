import { name__, prefix, type } from "../lib/meta.js";
import { fileprefix, semver } from "../lib/meta.bin.js";
import { SemVer, gt } from "semver";
import { concat } from 'uint8arrays/concat';
import crc32 from 'crc-32';
import { binToDec, decToBin } from "../lib/utils.js";
import { B64toUI8A, UI8AtoB64 } from "../lib/uint8.js";

function int8(n, le = true) {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setInt8(0, n, le);
    return new Uint8Array(buffer);
}

function version() {
    const major = int8(semver.major);
    const minor = int8(semver.minor);
    const patch = int8(semver.patch);
    return concat([major, minor, patch]);
}

function int32(n, le = true) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, n, le);
    return new Uint8Array(buffer);
}

function int16(n, le = true) {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setInt16(0, n, le);
    return new Uint8Array(buffer);
}

function data(uint8) {
    return [int32(uint8.length), uint8];
}

function fromInt32(bytes, le = true) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getInt32(0, le);
}

function fromInt16(bytes, le = true) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getInt16(0, le);
}

export async function toFile(isDir, extn, files, dirs, useCRC32, startsWithDot) {
    const header = concat([fileprefix, version()]);

    const extn8 = (extn == null || extn === "") 
        ? undefined
        : concat(data(B64toUI8A(extn)));

    const noPath = files.length == 1;
    const output = [];
    const files8 = [];
    let need = 1;
    function set(num) {
        let n = 4;                      // int32
        if (num <= 0xFF) n = 1;         // int8
        else if (num <= 0xFFFF) n = 2;  // int16
        need = Math.max(need, n);
    }
    for (const [path, content] of files) {
        const path8 = noPath ? [int32(0)] : data(B64toUI8A(path));
        const file8 = data(B64toUI8A(content));

        files8.push(path8, file8);
        set(fromInt32(path8[0]));
        set(fromInt32(file8[0]));
    }

    const dirs8 = [];
    for (let i = 0; i < dirs.length; i++) {
        const dir8 = data(B64toUI8A(dirs[i]));
        const zero = int32(0);

        dirs8.push(dir8, [zero, undefined]);
        set(fromInt32(dir8[0]));
    }

    const func = need == 1 ? int8 : need == 2 ? int16 : int32;
    function num(int32) {
        return func(fromInt32(int32));
    }
    for (let i = 0; i < files8.length; i++) {
        const [length, data] = files8[i];
        output.push(num(length));
        if (typeof data !== 'undefined') output.push(data);
    }
    for (let i = 0; i < dirs8.length; i++) {
        const [length, data] = dirs8[i];
        output.push(num(length));
        if (typeof data != 'undefined') output.push(data);
    }

    const npfiles = [[
        name__,
        files[0] ? files[0][1] : null
    ]];
    const checksum = int32(crc32.str(JSON.stringify(
        noPath ? npfiles : files
    )));

    const hasExtn = typeof extn8 != 'undefined';

    /*
        Bits:
        1 2 3 4 5 6 7 8
    */
    const flags = [
        decToBin(need - 1, 2), 
        isDir ? '1' : '0', 
        hasExtn ? '1' : '0', 
        useCRC32 ? '1' : '0', 
        startsWithDot ? '1' : '0'
    ].join('');

    const main = [int8(binToDec(flags))];
    if (hasExtn) main.push(extn8);
    if (useCRC32) main.push(checksum);

    return concat([
        header,
        ...main,
        ...output
    ]);
}

function makeSemVer([major, minor, patch]) {
    return new SemVer(major + '.' + minor + '.' + patch);
}

function corrupted(extra) {
    throw new Error(prefix+'Input file was corrupted.'+(
        extra ? ' ('+extra+')' : ''
    ));
}

export async function fromFile(uint8) {
    const d = new TextDecoder();

    const filetype = d.decode(uint8.subarray(0,5));
    if (filetype != type) throw new Error(prefix+'Input file type is not '+type);

    const jsscver = makeSemVer(uint8.subarray(5,8));
    if (gt(jsscver, makeSemVer([
        semver.major, semver.minor, semver.patch
    ]))) throw new Error(prefix+`Input file was compressed with a higher ${name__} version.`);

    const flags = decToBin(uint8[8]);
    let need = binToDec(flags.slice(0,-4)) + 1;
    if (isNaN(need)) need = 1;
    const isDir = flags.slice(-4, -3) == '1';
    const hasExtn = flags.slice(-3, -2) == '1';
    const hasCRC32 = flags.slice(-2, -1) == '1';
    const startsWithDot = flags.slice(-1) == '1';
    
    let i = 9;
    let legnthLength = 4;
    let func = fromInt32;
    function read() {
        if (i >= uint8.length) return null;
        if (i + legnthLength > uint8.length) corrupted();

        const length = func(uint8.subarray(i, i + legnthLength));
        i += legnthLength;

        if (length == 0) return 0;

        if (i + length > uint8.length) corrupted();

        const data = UI8AtoB64(uint8.subarray(i, i + length));
        i += length;

        return data;
    }
    
    const extn = hasExtn ? read() : 0;
    const checksum = hasCRC32 ? fromInt32(uint8.subarray(i, i + 4)) : undefined;
    if (hasCRC32) i += 4;
    legnthLength = need;
    func = need == 1 ? function(ui8a) {
        return ui8a[0];
    } : need == 2 ? fromInt16 : fromInt32;

    const files = [];
    const dirs = [];
    while (true) {
        const path = read();
        if (path == null) break;

        const content = read();
        if (content == null) corrupted();

        if (content == 0) dirs.push(path);
        else files.push([
            path == 0 ? name__ : path, content
        ]);

        if (i == uint8.length) break;
    }

    if (typeof checksum != 'undefined' && checksum != crc32.str(JSON.stringify(files))) {
        corrupted('CRC32');
    }

    return {
        isDir,
        extn: extn == 0 ? '' : extn,
        files,
        dirs,
        startsWithDot
    };
}
