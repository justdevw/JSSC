/*

MIT License

Copyright (c) 2025-2026 JustDeveloper <https://justdeveloper.is-a.dev/>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

/*
        _______________
    __ / / __/ __/ ___/
   / // /\ \_\ \/ /__  
   \___/___/___/\___/  
                       
   JavaScript String Compressor
   https://jssc.js.org/

*/

/**
 * JavaScript String Compressor - compress options
 * @license MIT
 * @copyright (c) 2025-2026 JustDeveloper <<https://justdeveloper.is-a.dev>>
 * @since 2.0.0
 */
export interface compressOptions {
    JUSTC?: boolean,
    segmentation?: boolean,
    recursiveCompression?: boolean,
    base64IntegerEncoding?: boolean,
    base64Packing?: boolean,
    offsetEncoding?: boolean,
    lzstring?: boolean,
    offsetEncode?: boolean,
    minifiedworker?: boolean,
    depthLimit?: number,
    workerLimit?: number,
    JSONstring?: boolean,
    debug?: boolean
}
/**
 * JavaScript String Compressor - decompress options
 * @license MIT
 * @copyright (c) 2025-2026 JustDeveloper <<https://justdeveloper.is-a.dev>>
 * @since 2.1.0
 */
export interface decompressOptions {
    stringify?: boolean,
    debug?: boolean
}
/**
 * JavaScript String Compressor - debug output
 * @license MIT
 * @copyright (c) 2025-2026 JustDeveloper <<https://justdeveloper.is-a.dev>>
 * @since 2.1.0
 */
export interface JSSCCompressedDebug {
    string: string,
    header: {
        code: number,
        bin: string,
        blocks: [string, "0"|"1", string, "0"|"1", "0"|"1", "0"|"1", string],
        code1: string,
        code2: string,
        code3: string,
        s: boolean,
        i: boolean,
        o: boolean,
        b: boolean
    },
    mode: {
        id: number,
        name: string
    }
}
/**
 * JavaScript String Compressor - debug output
 * @license MIT
 * @copyright (c) 2025-2026 JustDeveloper <<https://justdeveloper.is-a.dev>>
 * @since 2.1.0
 */
export interface JSSCDebug {
    input: string|object|number|JSSCCompressedDebug,
    output: string|object|number|JSSCCompressedDebug,
    options: compressOptions | decompressOptions,
    workers: boolean
}

/**
 * JavaScript String Compressor - compress function
 * @param str - Input string to compress
 * @returns Compressed string
 * @example
 * await compress('Hello, World!');
 * @since 1.0.0
 */
export function compress(str: string, options?: compressOptions): Promise<string|JSSCDebug>;
/**
 * JavaScript String Compressor - compress function
 * @param obj - Input object to compress
 * > **Note: it will `JSON.stringify()` your object so it may lose some data if your object has getters/setters/non-enumerables/etc.!**
 * @returns Compressed string
 * @example
 * await compress({a: "b"});
 * @since 2.0.0
 */
export function compress(obj: object, options?: compressOptions): Promise<string|JSSCDebug>;
/**
 * JavaScript String Compressor - compress function
 * @param int - Input integer to compress
 * @returns Compressed string
 * @example
 * await compress(10);
 * @since 2.0.0
 */
export function compress(int: number, options?: compressOptions): Promise<string|JSSCDebug>;

/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @returns Decompressed string/object/number
 * @example
 * await decompress(compressedString);
 * @since 1.0.0
 */
export function decompress(str: string): Promise<object|number|string|JSSCDebug>;
/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompress(compressedString, true);
 * @since 2.0.0
 */
export function decompress(str: string, stringify: true): Promise<string|JSSCDebug>;
/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @returns Decompressed string/object/number
 * @example
 * await decompress(compressedString);
 * @since 2.1.0
 */
export function decompress(str: string, options?: decompressOptions): Promise<object|number|string|JSSCDebug>;

/**
 * JavaScript String Compressor - compressToBase64 function
 * 
 * Compresses strings, integers and objects into non-standard Base64 strings (`0-9` `a-z` `A-Z` `+` `/`)
 * @param str - Input string to compress
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressToBase64('Hello, World!');
 * @since 2.1.0
 */
export function compressToBase64(str: string, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compressToBase64 function
 * 
 * Compresses strings, integers and objects into non-standard Base64 strings (`0-9` `a-z` `A-Z` `+` `/`)
 * @param obj - Input object to compress
 * > **Note: it will `JSON.stringify()` your object so it may lose some data if your object has getters/setters/non-enumerables/etc.!**
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressToBase64({a: "b"});
 * @since 2.1.0
 */
export function compressToBase64(obj: string, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compressToBase64 function
 * 
 * Compresses strings, integers and objects into non-standard Base64 strings (`0-9` `a-z` `A-Z` `+` `/`)
 * @param int - Input integer to compress
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressToBase64(10);
 * @since 2.1.0
 */
export function compressToBase64(int: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - compressToBase64URL function
 * 
 * Compresses strings, integers and objects into non-standard Base64URL strings (`0-9` `a-z` `A-Z` `-` `_`)
 * @param str - Input string to compress
 * @returns Compressed string in non-standard Base64URL format
 * @example
 * await compressToBase64URL('Hello, World!');
 * @since 2.1.0
 */
export function compressToBase64URL(str: string, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compressToBase64URL function
 * 
 * Compresses strings, integers and objects into non-standard Base64URL strings (`0-9` `a-z` `A-Z` `-` `_`)
 * @param obj - Input object to compress
 * > **Note: it will `JSON.stringify()` your object so it may lose some data if your object has getters/setters/non-enumerables/etc.!**
 * @returns Compressed string in non-standard Base64URL format
 * @example
 * await compressToBase64URL({a: "b"});
 * @since 2.1.0
 */
export function compressToBase64URL(obj: string, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compressToBase64URL function
 * 
 * Compresses strings, integers and objects into non-standard Base64URL strings (`0-9` `a-z` `A-Z` `-` `_`)
 * @param int - Input integer to compress
 * @returns Compressed string in non-standard Base64URL format
 * @example
 * await compressToBase64URL(10);
 * @since 2.1.0
 */
export function compressToBase64URL(int: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - compressToUint8Array function
 * 
 * Compresses strings, integers and objects into Uint8Arrays
 * @param str - Input string to compress
 * @returns Compressed Uint8Array
 * @example
 * await compressToUint8Array('Hello, World!');
 * @since 2.1.0
 */
export function compressToUint8Array(str: string, options?: compressOptions): Promise<Uint8Array<ArrayBuffer>>;
/**
 * JavaScript String Compressor - compressToUint8Array function
 * 
 * Compresses strings, integers and objects into Uint8Arrays
 * @param obj - Input object to compress
 * > **Note: it will `JSON.stringify()` your object so it may lose some data if your object has getters/setters/non-enumerables/etc.!**
 * @returns Compressed Uint8Array
 * @example
 * await compressToUint8Array({a: "b"});
 * @since 2.1.0
 */
export function compressToUint8Array(obj: string, options?: compressOptions): Promise<Uint8Array<ArrayBuffer>>;
/**
 * JavaScript String Compressor - compressToUint8Array function
 * 
 * Compresses strings, integers and objects into Uint8Arrays
 * @param int - Input integer to compress
 * @returns Compressed Uint8Array
 * @example
 * await compressToUint8Array(10);
 * @since 2.1.0
 */
export function compressToUint8Array(int: string, options?: compressOptions): Promise<Uint8Array<ArrayBuffer>>;

/**
 * JavaScript String Compressor - compressLarge function
 * 
 * Compresses large strings (`str.length > 1024`)
 * @param str - Input string to compress
 * @returns Compressed string
 * @example
 * await compressLarge('Hello, World!');
 * @since 2.1.0
 */
export function compressLarge(str: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - compressLargeToBase64 function
 * 
 * Compresses large strings (`str.length > 1024`) into non-standard Base64 strings (`0-9` `a-z` `A-Z` `+` `/`)
 * @param str - Input string to compress
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressLargeToBase64('Hello, World!');
 * @since 2.1.0
 */
export function compressLargeToBase64(str: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - compressLargeToBase64URL function
 * 
 * Compresses large strings (`str.length > 1024`) into non-standard Base64URL strings (`0-9` `a-z` `A-Z` `-` `_`)
 * @param str - Input string to compress
 * @returns Compressed string in non-standard Base64URL format
 * @example
 * await compressLargeToBase64URL('Hello, World!');
 * @since 2.1.0
 */
export function compressLargeToBase64URL(str: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - compressLargeToUint8Array function
 * 
 * Compresses large strings (`str.length > 1024`) into Uint8Arrays
 * @param str - Input string to compress
 * @returns Compressed Uint8Array
 * @example
 * await compressLargeToUint8Array('Hello, World!');
 * @since 2.1.0
 */
export function compressLargeToUint8Array(str: string, options?: compressOptions): Promise<Uint8Array<ArrayBuffer>>;

/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format (`0-9` `a-z` `A-Z` `+` `/`)
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64(compressedString);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string): Promise<object|number|string>;
/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format (`0-9` `a-z` `A-Z` `+` `/`)
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompressFromBase64(compressedString, true);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string, stringify: true): Promise<string>;
/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format (`0-9` `a-z` `A-Z` `+` `/`)
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64(compressedString);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string, options?: decompressOptions): Promise<object|number|string>;

/**
 * JavaScript String Compressor - decompressFromBase64URL function
 * @param str - Compressed string in non-standard Base64URL format (`0-9` `a-z` `A-Z` `-` `_`)
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64URL(compressedString);
 * @since 2.1.0
 */
export function decompressFromBase64URL(str: string): Promise<object|number|string>;
/**
 * JavaScript String Compressor - decompressFromBase64URL function
 * @param str - Compressed string in non-standard Base64URL format (`0-9` `a-z` `A-Z` `-` `_`)
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompressFromBase64URL(compressedString, true);
 * @since 2.1.0
 */
export function decompressFromBase64URL(str: string, stringify: true): Promise<string>;
/**
 * JavaScript String Compressor - decompressFromBase64URL function
 * @param str - Compressed string in non-standard Base64URL format (`0-9` `a-z` `A-Z` `-` `_`)
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64URL(compressedString);
 * @since 2.1.0
 */
export function decompressFromBase64URL(str: string, options?: decompressOptions): Promise<object|number|string>;

/**
 * JavaScript String Compressor - decompressFromUint8Array function
 * @param uint8arr - Compressed Uint8Array
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromUint8Array(compressedString);
 * @since 2.1.0
 */
export function decompressFromUint8Array(uint8arr: Uint8Array<ArrayBuffer>): Promise<object|number|string>;
/**
 * JavaScript String Compressor - decompressFromUint8Array function
 * @param uint8arr - Compressed string Uint8Array
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompressFromUint8Array(compressedString, true);
 * @since 2.1.0
 */
export function decompressFromUint8Array(uint8arr: Uint8Array<ArrayBuffer>, stringify: true): Promise<string>;
/**
 * JavaScript String Compressor - decompressFromUint8Array function
 * @param uint8arr - Compressed string Uint8Array
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromUint8Array(compressedString);
 * @since 2.1.0
 */
export function decompressFromUint8Array(uint8arr: Uint8Array<ArrayBuffer>, options?: decompressOptions): Promise<object|number|string>;

/**
 * JavaScript String Compressor - cache.clear function
 * 
 * Clears internal compressor cache
 * @example
 * cache.clear();
 * @since 2.1.0
 */
function clearCache(): void;

const cache: {
    max: number;
    readonly clear: typeof clearCache;
    readonly size: number;
};
const version: string;
const worker: {
    url: string | URL;
};

export {
    compress,
    decompress,
    compressToBase64,
    compressToBase64URL,
    compressToUint8Array,
    compressLarge,
    compressLargeToBase64,
    compressLargeToBase64URL,
    compressLargeToUint8Array,
    decompressFromBase64,
    decompressFromBase64URL,
    decompressFromUint8Array,
    cache,
    version,
    worker
};
