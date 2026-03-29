import fs from "fs";
import path from "path";
import { compress, decompress, compressLargeToBase64, compressToBase64, decompressFromBase64, JSSC } from "../src/index.js";
import { prefix, version, format, name__ } from "../lib/meta.js";
import JUSTC from "justc";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";
import { compress as compressUI, message } from "./windows/import.cjs";
import { toFile, fromFile } from "./format.js";
import readline from 'node:readline';

const args = process.argv.slice(2);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentdir = process.cwd();

const _winUI = path.resolve(__dirname, "./windows/ui");
const _winUIWait = path.resolve(_winUI, "./wait.ps1");
function winUIWait(text) {
    return spawn("powershell", [
        "-NoProfile", 
        "-ExecutionPolicy", "Bypass", 
        "-File", _winUIWait,
        "-Name", name__,
        "-Text", text
    ], { detached: false, stdio: ['pipe','ignore','ignore'] });
}

let WinUIWait = false;
let windows = false;
function exit(code, err) {
    if (WinUIWait) WinUIWait.kill();

    if (code == 1 && windows) message(name__, err);

    process.exit(code);
}
function ask(smth) {
    return new Promise((resolve)=>{
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(smth + ' ', input => {
            rl.close();
            resolve(input);
        });
    });
}

let mode = -1;
let file = -1;
let input = '';
let output = '';
let str = false;
let config = '';
let print = false;
let checksum = true;
let includeMeta = true;
let key = '';
function invalidArgs() {
    const e = 'Invalid arguments.';
    console.log(prefix + e);
    exit(1, e);
}
function help() {
    console.log(
        name__ + ' v' + version + ' CLI\n\n' + (
            'Usage:\n\n' +
            'jssc <inputFile>\n' +
            'jssc <inputFile> <outputFile>\n' +
            'jssc <inputFile> --decompress\n' +
            'jssc <inputFile> <outputFile> --decompress\n\n\n' +
            'Flags:\n\n' +
            'Short flag,  Argument(s),  \tFlag,               Argument(s)   \t:\t Description\n' +
            '---------------------------\t----------------------------------\t÷\t ------------------------------------------------------------------------------------------------------\n' +
            '-C                         \t--compress                        \t:\t Compress input string/file. (Default)\n' +
            '-c           <file.justc>  \t--config            <file.justc>  \t:\t Set custom compressor configuration, same as the JS API, but it should be a JUSTC language script.\n' +
            '-d                         \t--decompress                      \t:\t Decompress input string/file.\n' +
            '-dc                        \t--disable-checksum                \t:\t Do not include CRC32 in the JSSC Archive. (Saves 4 bytes, but removes corruption protection)\n' +
            '-dm                        \t--disable-metadata                \t:\t Do not include metadata in the JSSC Archive. (Reduces archive size, but loses mtime)\n' +
            '-h                         \t--help                            \t:\t Print JSSC CLI usage and flags.\n' +
            '-i           <input>       \t--input             <input>       \t:\t Set input file path / Set input string.\n' +
            '-k           <key>         \t--key               <key>         \t:\t Set key to encrypt/decrypt JSSC Archive.\n' +
            '-o           <output.jssc> \t--output            <output.jssc> \t:\t Set output file path.\n' +
            '-p                         \t--print                           \t:\t Print output file content. Note that JSSC operates on UTF-16, so the printed output may get corrupted.\n' +
            '-s                         \t--string                          \t:\t Set input type to string. The output file type will not be JSSC1, but a compressed string.\n' +
            '-v                         \t--version                         \t:\t Print current JSSC version.\n' +
            '-w                         \t--windows                         \t:\t Use JSSC Windows integration. Synchronously waits for user input. (Requires JSSC Windows integration)\n' +
            '-wi                        \t--windows-install                 \t:\t Install JSSC Windows integration. (Windows only)\n' +
            '-wu                        \t--windows-uninstall               \t:\t Uninstall JSSC Windows integration. (Windows only)'
        ).replaceAll('-\t', '-' + '- '.repeat(3)).replaceAll('\t -', ' -'.repeat(3) + ' -').replaceAll('\t', ' '.repeat(6))
    )
}
function checkWindows() {
    if (process.platform !== "win32") {
        const e = 'process.platform is not "win32".';
        console.log(prefix + e);
        exit(1, e);
    }
}
for (const arg of args) {
    if (file == 0) {
        input = arg;
        file = -1;
    } else if (file == 1) {
        output = arg;
        file = -1;
    } else if (file == 2) {
        config = arg;
        file = -1;
    } else if (file == 3) {
        key = arg;
        file = -1;
    } else switch (arg) {
        case '-h': case '--help': {
            help();
            break;
        }
        case '-v': case '--version': {
            console.log(version);
            break;
        }
        case '-C': case '--compress': {
            if (mode == -1) mode = 0;
            else invalidArgs();
            break;
        }
        case '-d': case '--decompress': {
            if (mode == -1) mode = 1;
            else invalidArgs();
            break;
        }
        case '-i': case '--input': {
            if (file == -1 && input == '') file = 0;
            else invalidArgs();
            break;
        }
        case '-o': case '--output': {
            if (file == -1 && output == '') file = 1;
            else invalidArgs();
            break;
        }
        case '-s': case '--string': {
            str = true;
            break;
        }
        case '-c': case '--config': {
            if (file == -1 && config == '') file = 2;
            else invalidArgs();
            break;
        }
        case '-p': case '--print': {
            print = true;
            break;
        }
        case '-wi': case '--windows-install': {
            checkWindows();
            execSync('node '+path.resolve(__dirname, "./windows/install.js"));
            break;
        }
        case '-wu': case '--windows-uninstall': {
            checkWindows();
            execSync('node '+path.resolve(__dirname, "./windows/uninstall.js"));
            break;
        }
        case '-w': case '--windows': {
            checkWindows();
            windows = true;
            break;
        }
        case '-dc': case '--disable-checksum': {
            checksum = false;
            break;
        }
        case '-dm': case '--disable-metadata': {
            includeMeta = false;
            break;
        }
        case '-k': case '--key': {
            if (file == -1 && key == '') file = 3;
            else invalidArgs();
            break;
        }
        default:
            if (input == '') input = arg;
            else if (output == '') output = arg;
            else invalidArgs();
            break;
    }
}

if (mode != -1 && input == '') {
    const e = 'Missing input.'
    console.log(prefix + e);
    exit(1, e);
} else if (mode == -1 && input != '') {
    mode = 0;
}
if (args.length == 0) help();
if (mode == -1) exit(0);

if (str && windows) exit(1, 'Invalid flags. Cannot use JSSC Windows Integration to compress a string.');
if (str && checksum) exit(1, 'Invalid flags. JSSC-compressed strings do not have a checksum.');
if (str && key) exit(1, 'Invalid flags. JSSC-compressed strings do not have encryption with a key.');

async function collectFiles(targetPath) {
    try {
        const stats = fs.statSync(targetPath);

        if (stats.isFile()) {
            return [targetPath];
        }

        if (stats.isDirectory()) {
            const files = [];

            function walk(dir) {
                for (const entry of fs.readdirSync(dir)) {
                    const full = path.join(dir, entry);
                    const stat = fs.statSync(full);

                    if (stat.isDirectory()) walk(full);
                    else files.push(full);
                }
            }

            walk(targetPath);
            return files;
        }
    } catch (_){}

    return null
}

function getRoot(inp) {
    const parsed = path.parse(inp);
    if (parsed.dir != '') return parsed.dir.split(path.sep)[0];
    return parsed.name;
}

const defaultConfig = {
    JUSTC: true,
    recursiveCompression: true,
    segmentation: true,
    base64IntegerEncoding: true,
    base64Packing: true,
    offsetEncoding: true,
    lzstring: true,

    offsetEncode: false,
    depthLimit: 10,
    workerlimit: 2,
    minifiedWorker: false,

    stringify: true,
    
    debug: false,
    depth: 0,
    worker: 0,
};

function findEmptyDirs(dir) {
    if (!fs.statSync(dir).isDirectory()) return [];

    let emptyDirs = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const path_ = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            emptyDirs = [...emptyDirs, ...findEmptyDirs(path_)];
            
            const content = fs.readdirSync(path_);
            if (content.length === 0) {
                emptyDirs.push(path_);
            }
        }
    }
    return emptyDirs;
}

const instance = windows ? new JSSC() : {
    compressLargeToBase64, compressToBase64, decompressFromBase64
};

(async (inp, out, cfg) => {
    const inpF = await collectFiles(inp);
    const isFile = !str ? inpF != null : !str;
    const input = isFile ? inpF : [inp];

    const isDir = (() => {
        try {
            return fs.statSync(inp).isDirectory()
        } catch (_){}
        return null
    })();
    if (mode == 1 && isDir) {
        const e = 'Invalid input.';
        console.log(prefix + e);
        exit(1, e);
    }

    if (!str && inpF == null) {
        const e = 'File not found.';
        console.log(prefix + e);
        exit(1, e);
    }

    let output = await collectFiles(out) || [out];
    let addFormat = false;
    if (output.length > 1) {
        output = [path.join(getRoot(out), path.parse(inp).name)];
        addFormat = true;
    }

    else if (output[0] == '' && isFile) {
        addFormat = true;
        if (isDir) output = [path.join(getRoot(out), path.parse(inp).name)];
        else if (path.extname(inp).length > 0) output = [inp.slice(0, -(path.extname(inp).length))];
        else output = [inp];
    }

    let config = await collectFiles(cfg) || [''];
    if (config.length > 1) {
        const e = 'Invalid config input.';
        console.log(prefix + e);
        exit(1, e);
    }
    config = config[0];
    if (config == '') config = defaultConfig; 
    else {
        config = fs.readFileSync(config).toString('utf8');
        config = {
            ...defaultConfig,
            ...await JUSTC.execute(config)
        };
    }

    if (mode == 0) {
        if (isFile && print) {
            const e = 'Invalid flags. Cannot compress a file/directory to JSSC1 archive and print the result.';
            console.log(prefix + e);
            exit(1, e);
        }
        if (!(()=>{
            if (!windows || !isFile) return true;

            const customConfig = {};

            const res = compressUI(
                name__,
                path.parse(inp).name + path.parse(inp).ext,
                inp,
                config
            );

            try {
                customConfig.JUSTC = res[1].checked1;
                customConfig.recursiveCompression = res[1].checked2;
                customConfig.segmentation = res[1].checked3;
                customConfig.base64IntegerEncoding = res[1].checked4;
                customConfig.base64Packing = res[1].checked5;
                customConfig.offsetEncoding = res[1].checked6;
                customConfig.lzstring = res[1].checked7;

                customConfig.depthLimit = Math.max(res[1].slider, 1);

                config = {
                    ...config,
                    ...customConfig
                };

                return res[0];
            } catch (_) {
                return false;
            }
        })()) exit(0);

        let extn = '';
        if (!isDir) {
            const extname = path.extname(input[0]);
            if (path.parse(input[0]).name != extname) extn = extname;
        }

        if (windows) {
            WinUIWait = winUIWait('Compressing "' + path.parse(inp).name + '"...');
            instance.events.onCompressProgress = (percentage) => {
                WinUIWait.stdin.write(percentage + "\n");
            };
        }

        config.stringify = undefined;

        if (str) {
            const compressed = await compress(input[0], config);
            if (output[0] != '') {
                fs.mkdirSync(path.dirname(output[0]), { recursive: true });
                fs.writeFileSync(output[0], compressed, { encoding: 'utf8' });
            }
            if (print) {
                console.log(compressed);
            }
            exit(0);
        }

        const root = path.resolve(currentdir);
        let prev = root;

        function p(to) {
            const abs = path.resolve(to);
            const rel = path.relative(prev, abs);
            prev = path.dirname(abs);
            return rel.replaceAll("\\", "/");
        }

        const files = [];
        for (const file of input.sort((a,b)=>a.localeCompare(b))) {
            const current = p(file);

            files.push([
                (await instance.compressToBase64(current, config)).replace(/=+$/, ''),
                (await instance.compressLargeToBase64(
                    fs.readFileSync(file, { encoding: 'utf8' }), 
                    config
                )).replace(/=+$/, ''),
                Math.floor(fs.statSync(file).mtimeMs / 1000)
            ]);
        }
        const dirs = [];
        for (const dir of findEmptyDirs(inp)) {
            const current = p(dir);
            dirs.push((await instance.compressToBase64(current, config)).replace(/=+$/, ''));
        }
        
        const startsWithDot = extn[0] == '.';
        fs.writeFileSync(output[0] + (
            addFormat ? format : ''
        ), await toFile(
            isDir,
            extn == '' ? null : (await instance.compressToBase64(
                startsWithDot ? extn.slice(1) : extn, config
            )).replace(/=+$/, ''),
            files,
            dirs,
            checksum,
            startsWithDot,
            includeMeta,
            key != '',
            key
        ));
        exit(0);
    } else {
        if (print && isFile) {
            const e = 'Invalid flags. Cannot decompress JSSC1 archive and print the result.';
            console.log(prefix + e);
            exit(1, e);
        }
        if (windows) {
            WinUIWait = winUIWait('Decompressing "' + path.parse(inp).name + '"...');
        }

        const raw = isFile ? fs.readFileSync(input[0]) : input[0];

        if (str) {
            try {
                const decompressed = await decompress(raw);
                if (output[0] != '') {
                    fs.mkdirSync(path.dirname(output[0]), { recursive: true });
                    fs.writeFileSync(output[0], decompressed, { encoding: 'utf8' });
                }
                if (print) {
                    console.log(decompressed);
                }
                exit(0);
            } catch (err) {
                const e = prefix + 'Input string was corrupted: ' + err;
                console.error(e);
                exit(1, e);
            }
        }

        try {
            const {isDir, extn, files, dirs, startsWithDot} = await fromFile(raw, async () => {
                const q = prefix + 'The input JSSC Archive is encrypted and requires a password to decrypt it. Please enter the password:';
                let password;

                if (key != '') password = key;
                else if (windows) password;
                else password = await ask(q);

                return password;
            });

            function checkPath(p) {
                const safe = path.resolve(p);
                const root = path.resolve(output[0]);

                if (!safe.startsWith(root + path.sep) && safe !== root) {
                    const e = prefix + 'Attempt to extract a file or directory outside the archive root. The archive may be malicious or corrupted.';
                    console.error(e);
                    exit(1, e);
                }

                return safe;
            }

            let current;
            for (const [filePath, content, mtime] of files) {
                const delta = (await instance.decompressFromBase64(filePath)).replaceAll("/", path.sep);

                let fullPath;
                const dot = (startsWithDot ? '.' : '');
                let ext = '';
                if (typeof current === "undefined") {
                    fullPath = path.resolve(output[0], delta);
                } else {
                    fullPath = path.resolve(path.dirname(current), delta);
                }
                if (!isDir) {
                    ext = await instance.decompressFromBase64(extn);
                    fullPath = output[0] + dot + ext;
                }

                const isRootFile = (
                    files.length === 1 && filePath === '' && !isDir
                );
                if (!isRootFile) current = checkPath(fullPath);

                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, await instance.decompressFromBase64(content), { encoding: "utf8" });
                try {
                    fs.utimesSync(fullPath, mtime, mtime);
                } catch (err) {
                    const e = prefix + `Failed to set mtime ("last modified") for "${fullPath}" (${mtime}): ` + err;
                    console.warn(e, '\n', err.stack);
                    if (windows) message(name__, e, 'Warning')
                }
            }
            for (let i = 0; i < dirs.length; i++) {
                const delta = (await instance.decompressFromBase64(dirs[i])).replaceAll("/", path.sep);

                let fullPath;
                if (typeof current === "undefined") {
                    fullPath = path.resolve(output[0], delta);
                } else {
                    fullPath = path.resolve(path.dirname(current), delta);
                }
                current = checkPath(fullPath);

                fs.mkdirSync(fullPath, { recursive: true });
            }
            exit(0);
        } catch (err) {
            const e = prefix + err;
            console.error(e, '\n', err.stack);
            exit(1, e);
        }
    }
})(input, output, config);
