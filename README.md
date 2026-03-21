![JSSC](.github/image.png)

# JSSC — JavaScript String Compressor
JSSC is an open-source, **lossless string compression algorithm** designed specifically for JavaScript strings (UTF-16). It produces compressed data that remains a valid JS string, making it ideal for environments where binary data is difficult to handle.

> **Note:** The npm package is named [`strc`](https://www.npmjs.com/package/strc). <br>
> The `jssc` ("jSSC") npm package is unrelated to this project. <br>
> Both names (uppercase "JSSC" and lowercase "strc") refer to the same project.

JSSC is a complex algorithm featuring multiple internal compression modes tailored for different data structures. During compression, each mode evaluates the input; if its specific conditions are met, it produces a **candidate** string. JSSC then selects the best candidate — the one that achieves the highest compression ratio while passing a mandatory lossless decompression check. This approach results in a slower compression phase but ensures **high compression ratio** and **fast decompression**, as no brute-forcing or validation is required during recovery.

⚠️ **Compatibility Notice:** Compressed strings from v1.x.x are **not compatible** with v2.x.x due to header and encoding changes. JSSC follows Semantic Versioning: successful decompression is guaranteed only if the decompressor version is equal to or newer than the compressor version (within the same major version).

## Key Features
- ~**2.5:1 average compression ratio**. 
- **String-to-String**: No binary buffers or external metadata.
- **Self-validating**: Compressed string is guaranteed to be successfully decompressed and with no data loss (if the string is not corrupted and the string was compressed by same major and not larger minor and patch version following SemVer).
- **TypeScript support** and fully-typed API.

## Documentation
Full documentation, API reference, and live examples are available at **[jssc.js.org](https://jssc.js.org/)**.

## Quick start
```
npm i strc
```
```js
import { compress, decompress } from 'strc';

const data = "Hello, world!";
const compressed = await compress(data);
const original = await decompress(compressed);
```

CLI:
```
npx jssc --help
```

Website/Browsers:
```html
<script src="https://unpkg.com/justc"></script>
<script src="https://unpkg.com/strc"></script>
```
```js
const data = "Hello, world!";
const compressed = await JSSC.compress(data);
const original = await JSSC.decompress(compressed);
```

## Dependencies
JSSC depends on:
- <img align="top" src="https://just.js.org/justc/logo-50.svg" alt="JUSTC Logo" width="26" height="26"> [JUSTC](https://just.js.org/justc) by [JustStudio.](https://juststudio.is-a.dev/)
- [lz-string](https://github.com/pieroxy/lz-string/) by [pieroxy](https://github.com/pieroxy)
- [unicode-emoji-json](https://www.npmjs.com/package/unicode-emoji-json) by [Mu-An Chiou](https://github.com/muan)
- [utf8.js](https://github.com/mathiasbynens/utf8.js) by [Mathias Bynens](https://mathiasbynens.be/)

JSSC CLI and Format Handling (`.jssc`) depends on:
- [crc-32](https://www.npmjs.com/package/crc-32) by [SheetJS](https://sheetjs.com/)
- [semver](https://semver.npmjs.com/) by [npm](https://www.npmjs.com/)
- [uint8arrays](https://www.npmjs.com/package/uint8arrays) by [Alex Potsides](https://github.com/achingbrain)

> **Note:** All dependencies (except **JUSTC**) are bundled into the final build.

## License
[MIT © 2025-2026 JustDeveloper](https://github.com/justdevw/JSSC/blob/main/LICENSE)
