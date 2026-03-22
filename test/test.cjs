const JSSC = require('../dist/jssc.cjs');

function stringChunks(str, num) {
    const output = [];
    for (let i = 0; i < str.length; i += num) {
        output.push(str.slice(i, i + num))
    }
    return output
}

const encodings = [
    '00: JSSCBASE',
    '01: JSSCRU',
    '02: JSSCENRU',
    '03: JSSCENKK',
    '04: JSSCHI',
    '05: JSSCENHI',
    '06: JSSCBN',
    '07: JSSCENBN',
    '08: JSSCHIBN',
    '09: JSSCJA',
    '10: JSSCTelu',
    '11: JSSCMR',
    '12: JSSCB',
    '13: JSSCE',
    '14: JSSCAR',
];
const modes = [
    '00: No Compression',
    '01: Two-Digit CharCode Concatenation',
    '02: Two-Byte CharCode Concatenation',
    '03: Decimal Integer Packing',
    '04: Alphabet Encoding',
    '05: Character Encoding',
    '06: Inline Integer Encoding',
    '07: Frequency Map',
    '08: URL',
    '09: Segmentation',
    '10: String Repetition',
    '12: Emoji Packing',
    '13: Base-64 Integer Encoding',
    '14: Base-64 Packing',
    '17: Segmentation',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    'RESERVED',
    '16: lzstring',
    '15: Offset Encoding',
    '11: Recursive compression',
];

async function test(text, name) {
    console.info('\n\n\n\n\nRunning compress tests (', name, ') ...');

    const a = await JSSC.compress(text);
    const b = await JSSC.decompress(a);
    const c = a.charCodeAt(0).toString(2).padStart(16, '0');

    const toString = typeof text != 'object' ? String(text) : JSON.stringify(text);

    const data = a.slice(0,1);
    const bits = stringChunks(c, 4).join(' ');
    const blocks = [];
    const code = [];

    for (const [x,y] of [
        [0,4],  [4,5], 
        [5,8],  [8,9], 
        [9,10], [10,11], [11]
    ]) blocks.push(c.slice(x,y));
    
    for (const [x,y] of [
        [11], [0,4], [5,8]
    ]) code.push(parseInt(c.slice(x,y), 2));
    
    const success = [
        text == b, 
        a.length <= toString.length,
    ];
    const result = success[0] && success[1];

    console.log(
        '\n\n\nOriginal:', text, '\n\nCompressed:', a, '\n\nDecompressed:', b, 
        '\n\n\nSuccess?', result, '(Decompressed successfully?', success[0], '; Compressed size ≤ Original size?', success[1], ')\nOriginal size:', toString.length * 16, 'bits\nCompressed size:', a.length * 16, 'bits\nSaved:', toString.length * 16 - a.length * 16, 'bits\nRatio:', (toString.length * 16) / (a.length * 16), 
        ': 1\n\n\n16-bit Data/Header character:', data, '\nCharCode:', data.charCodeAt(0), '\nBits:', bits, '\nBlocks:', ...blocks, '\nCode 1:', code[0], '\nCode 2:', code[1], c.slice(10,11) == '1' ? '\nBeginID:' : '\nCode 3:', code[2], '\nSequences?', c.slice(4,5) == '1', (code[1] > 0 && code[0] == 0) || code[0] == 6 ? '\nReturn as number?' : '\nInput RLE?', c.slice(8,9) == '1', '\nOutput RLE?', c.slice(9,10) == '1', '\nCode 3 is BeginID?', c.slice(10,11) == '1',
        '\n\nMode:', modes[code[0]], code[0] == 5 ? '\nCharacter Encoding:' : code[0] == 31 ? '\nCompressed:' : '', code[0] == 5 ? encodings[code[1]] : code[0] == 31 ? code[1] + 1 : '', code[0] == 31 ? 'times' : '', '\n\n\n\n\n'
    );

    return result;
}
async function runTest(text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', name = 'Lorem ipsum') {
    const result = await test(text, name);
    if (!result) throw new Error('Failed to decompress. decompress(text) != text');
}

const tests = async function () {
    await runTest();
    await runTest('foo'.repeat(1000), 'foo x1000');
    await runTest('ыалалыылаар', 'ыалалыылаар');
    await runTest(String(Math.round(Math.random() * 256000000)), 'random numbers');
    await runTest('asdasdsasdsadsdadsadssssssssssssssssssssыꙮ'.repeat(15), 'absolutely random stuff');
    await runTest('aaaaaaaaaaaaaaa1ыыыыыыыыыыыыыꙮ'.repeat(30), 'should use recursive compression mode');
}

tests().then(()=>{});
