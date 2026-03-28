export function stringCodes(str) {
    let output = [];
    let max = 0;
    let maxCharCode = 0;
    let minCharCode = 65535;
    let min = Infinity;
    const string = String(str);
    for (let i = 0; i < string.length; i++) {
        const code = string.charCodeAt(i);
        output.push(code);
        max = Math.max(max, code.toString().length);
        maxCharCode = Math.max(maxCharCode, code);
        min = Math.min(min, code.toString().length);
        minCharCode = Math.min(minCharCode, code);
    }
    return {max, output, maxCharCode, min, minCharCode};
}

export function codesString(cds) {
    const output = [];
    cds.forEach(code => {
        output.push(String.fromCharCode(code));
    });
    return output.join('');
}

export function charCode(num) {
    return String.fromCharCode(num + 32);
}
export function checkChar(cde) {
    return cde % 65535 === cde
}

export function stringChunks(str, num) {
    const output = [];
    for (let i = 0; i < str.length; i += num) {
        output.push(str.slice(i, i + num))
    }
    return output
}
export function chunkArray(array, num) {
    const result = [];
    for (let i = 0; i < array.length; i += num) {
        result.push(array.slice(i, i + num));
    }
    return result;
}

export function decToBin(num, wnum) {
    return num.toString(2).padStart(wnum, '0');
}
export function binToDec(str) {
    return parseInt(str, 2);
}
