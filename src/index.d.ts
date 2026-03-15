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
    debug?: boolean
}
export interface decompressOptions {
    stringify?: boolean,
    debug?: boolean
}

/**
 * JavaScript String Compressor - compress function
 * @param str - Input string to compress
 * @returns Compressed string
 * @example
 * await compress('Hello, World!');
 * @since 1.0.0
 */
export function compress(str: string, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compress function
 * @param obj - Input object to compress
 * > **Note: it will `JSON.stringify()` your object so it may lose some data if your object has getters/setters/non-enumerables/etc.!**
 * @returns Compressed string
 * @example
 * await compress({a: "b"});
 * @since 2.0.0
 */
export function compress(obj: object, options?: compressOptions): Promise<string>;
/**
 * JavaScript String Compressor - compress function
 * @param int - Input integer to compress
 * @returns Compressed string
 * @example
 * await compress(10);
 * @since 2.0.0
 */
export function compress(int: number, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @returns Decompressed string/object/number
 * @example
 * await decompress(compressedString);
 * @since 1.0.0
 */
export function decompress(str: string): Promise<object|number|string>;
/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompress(compressedString, true);
 * @since 2.0.0
 */
export function decompress(str: string, stringify: true): Promise<string>;
/**
 * JavaScript String Compressor - decompress function
 * @param str - Compressed string to decompress
 * @returns Decompressed string/object/number
 * @example
 * await decompress(compressedString, true);
 * @since 2.1.0
 */
export function decompress(str: string, options?: decompressOptions): Promise<object|number|string>;

/**
 * JavaScript String Compressor - compressToBase64 function
 * 
 * Compresses strings, integers and objects into non-standard Base64 strings
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
 * Compresses strings, integers and objects into non-standard Base64 strings
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
 * Compresses strings, integers and objects into non-standard Base64 strings
 * @param int - Input integer to compress
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressToBase64(10);
 * @since 2.1.0
 */
export function compressToBase64(int: string, options?: compressOptions): Promise<string>;

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
 * Compresses large strings (`str.length > 1024`) into non-standard Base64 strings
 * @param str - Input string to compress
 * @returns Compressed string in non-standard Base64 format
 * @example
 * await compressLargeToBase64('Hello, World!');
 * @since 2.1.0
 */
export function compressLargeToBase64(str: string, options?: compressOptions): Promise<string>;

/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64(compressedString);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string): Promise<object|number|string>;
/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format
 * @param stringify - Always return string?
 * @returns Decompressed string
 * @example
 * await decompressFromBase64(compressedString, true);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string, stringify: true): Promise<string>;
/**
 * JavaScript String Compressor - decompressFromBase64 function
 * @param str - Compressed string in non-standard Base64 format
 * @returns Decompressed string/object/number
 * @example
 * await decompressFromBase64(compressedString, true);
 * @since 2.1.0
 */
export function decompressFromBase64(str: string, options?: decompressOptions): Promise<object|number|string>;

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
    compressLarge,
    compressLargeToBase64,
    decompressFromBase64,
    cache,
    version,
    worker
};
