import { convertBase } from "./third-party/convertBase.js";
import { stringChunks } from "./utils.js";

export function B64toUI8A(B64) {
    const convert = [0, 3, 2, 1];
    const add = convert[B64.length % 4];
    B64 = '0'.repeat(add) + B64;

    const bin6 = [];
    for (let i = 0; i < B64.length; i++) {
        const bin = convertBase(B64[i], 64, 2);
        if (bin != null) bin6.push(bin.padStart(6, '0'));
    }
    
    const bin8 = stringChunks(bin6.join(''), 8);
    const int8 = [add];
    for (let i = 0; i < bin8.length; i++) {
        int8.push(parseInt(bin8[i], 2));
    }

    return new Uint8Array(int8);
}

export function UI8AtoB64(UI8A) {
    const remove = UI8A[0];
    const bin8 = [];
    for (let i = 1; i < UI8A.length; i++) {
        bin8.push(UI8A[i].toString(2).padStart(8, '0'));
    }

    const bin6 = stringChunks(bin8.join(''), 6);
    const B64 = [];
    for (let i = 0; i < bin6.length; i++) {
        B64.push(convertBase(bin6[i], 2, 64));
    }

    return B64.join('').slice(remove);
}
