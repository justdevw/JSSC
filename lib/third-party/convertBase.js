export const B64 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
export const URL = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
/**
 * This is a modified https://stackoverflow.com/a/55011290 code. https://stackoverflow.com/a/55011290 -
 * by Slavik Meltser (https://stackoverflow.com/users/1291121/slavik-meltser) -
 * a modified https://www.danvk.org/hex2dec.html code.
 * @param {string} str 
 * @param {number} fromBase 
 * @param {number} toBase 
 * @param {string?} DIGITS
 * @returns {string}
 */
export function convertBase(str, fromBase, toBase, DIGITS = B64) {

    const add = (x, y, base) => {
        let z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i++;
        }
        return z;
    }

    const multiplyByNumber = (num, x, base) => {
        if (num < 0) return null;
        if (num == 0) return [];

        let result = [];
        let power = x;
        while (true) {
            num & 1 && (result = add(result, power, base));
            num = num >> 1;
            if (num === 0) break;
            power = add(power, power, base);
        }

        return result;
    }

    const parseToDigitsArray = (str, base) => {
        const digits = str.split('');
        let arr = [];
        for (let i = digits.length - 1; i >= 0; i--) {
            const n = DIGITS.indexOf(digits[i])
            if (n == -1) return null;
            arr.push(n);
        }
        return arr;
    }

    const digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
        power = multiplyByNumber(fromBase, power, toBase);
    }

    const out = [];
    for (let i = outArray.length - 1; i >= 0; i--)
        out.push(DIGITS[outArray[i]]);

    if (out.length == 0) out.push('0');

    return out.join('');
}
