import { prefix, version } from '../lib/meta.js';
if ((String.fromCharCode(65536).charCodeAt(0) === 65536) || !(String.fromCharCode(256).charCodeAt(0) === 256)) {
    throw new Error(prefix+'Supported UTF-16 only!')
}

import {
    compress, decompress,
    compressToBase64, decompressFromBase64,
    compressToBase64URL, decompressFromBase64URL,
    compressToUint8Array, decompressFromUint8Array,
    compressLarge, compressLargeToBase64, compressLargeToBase64URL, compressLargeToUint8Array,
    
    getWorkerURL, setWorkerURL
} from './core.js';
import { setMaxCache, getMaxCache, validateCache } from './cache.js';

const cache = {
    get['max'] () {
        return getMaxCache();
    },
    set['max'] (number) {
        setMaxCache(number);
    },
    get['clear'] () {
        return function() {
            validateCache.clear();
        }
    },
    get['size'] () {
        return validateCache.size;
    }
}
const worker = {
    get['url'] () {
        return getWorkerURL();
    },
    set['url'] (url) {
        setWorkerURL(url);
    }
}

export {
    compress, decompress,
    compressToBase64, decompressFromBase64,
    compressToBase64URL, decompressFromBase64URL,
    compressToUint8Array, decompressFromUint8Array,
    compressLarge, compressLargeToBase64, compressLargeToBase64URL, compressLargeToUint8Array,

    cache, version, worker
}
