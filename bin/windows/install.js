#!/usr/bin/env node

if (process.platform !== "win32") {
    process.exit(0);
}

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { confirm, welcome } from "./ui.js";
import { name__, repo, site } from "../../lib/meta.js";
import { message } from "./message.js";

if (
    (()=>{
        try {
            execSync('reg query HKCU\\Software\\Classes\\.jssc', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    })()
) {
    process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_NAME = "JSSC";
const EXT = ".jssc";

const installDir = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
    "JSSC"
);

const iconPath = path.join(installDir, "jssc.ico");
const localPkg = path.join(installDir, "pkg");
const localBin = path.join(localPkg, "dist");
const localCfg = path.join(installDir, "default.justc");
const localVbs = path.join(installDir, "jssc.vbs");

const pkgRoot = path.resolve(__dirname, "../../");
const cliPath = path.resolve(localBin, "./cli.js");
const cfgPath = path.resolve(localBin, "./windows/default.justc");
const vbsPath = path.resolve(localBin, "./windows/jssc.vbs");
const icoPath = path.resolve(localBin, "./windows/icon.ico");
const nodePath = process.execPath;

const ui = path.resolve(__dirname, "./ui");
const uiProgressBar = path.resolve(ui, "./wait.ps1");

function run(cmd) {
    execSync(cmd, { stdio: "inherit" });
}

function showProgress() {
    return spawn("powershell", [
        "-NoProfile", 
        "-ExecutionPolicy", "Bypass", 
        "-File", uiProgressBar,
        "-Name", name__,
        "-Text", "Installing JSSC Windows integration..."
    ], { detached: false, stdio: 'ignore' });
}

async function setup() {
    const progressUI = showProgress();

    let e = [false, undefined];
    try {
        fs.mkdirSync(localPkg, {
            recursive: true
        });
        fs.cpSync(pkgRoot, localPkg, {
            recursive: true,
            force: true
        });
        fs.copyFileSync(cfgPath, localCfg);
        fs.copyFileSync(vbsPath, localVbs);
        fs.copyFileSync(icoPath, iconPath);

        const vbs = `wscript.exe \\"${localVbs}\\" \\"${nodePath}\\" \\"${cliPath}\\"`;

        run(`reg add HKCU\\Software\\Classes\\${EXT} /ve /d ${APP_NAME} /f`);

        // Description
        run(`reg add HKCU\\Software\\Classes\\${APP_NAME} /ve /d "JSSC Archive" /f`);

        // Icon
        run(`reg add HKCU\\Software\\Classes\\${APP_NAME}\\DefaultIcon /ve /d "${iconPath}" /f`);

        // Open command
        run(`reg add HKCU\\Software\\Classes\\${APP_NAME}\\shell\\open\\command /ve /d "${vbs} \\"%1\\" -d -w -c \\"${localCfg}\\"" /f`);

        // Context menu (files)
        run(`reg add HKCU\\Software\\Classes\\*\\shell\\JSSC /ve /d "Compress to JSSC (.jssc)" /f`);
        run(`reg add HKCU\\Software\\Classes\\*\\shell\\JSSC\\command /ve /d "${vbs} \\"%1\\" -w -c \\"${localCfg}\\"" /f`);
        run(`reg add HKCU\\Software\\Classes\\*\\shell\\JSSC /v Icon /d "${iconPath}" /f`);

        // Context menu (dirs)
        run(`reg add HKCU\\Software\\Classes\\Directory\\shell\\JSSC /ve /d "Compress to JSSC (.jssc)" /f`);
        run(`reg add HKCU\\Software\\Classes\\Directory\\shell\\JSSC\\command /ve /d "${vbs} \\"%1\\" -w -c \\"${localCfg}\\"" /f`);
        run(`reg add HKCU\\Software\\Classes\\Directory\\shell\\JSSC /v Icon /d "${iconPath}" /f`);
    } catch (_) {
        e = [true, _];
    } finally {
        if (progressUI) progressUI.kill();
        if (welcome(name__,
            'JSSC Windows integration has just been installed on your\ncomputer.\n\n' +
            'Thanks for installing JavaScript String Compressor.\n' + 
            "If you don't see any changes or .jssc file icons, try\nrebooting your computer.",
        repo, site)) {
            run(`powershell -Command "Start-Process cmd -ArgumentList '/c shutdown /r /t 1' -Verb RunAs -WindowStyle Hidden"`);
        }
    }

    if (e[0]) throw e[1];
}

if (confirm(name__, 
    'Thanks for using JavaScript String Compressor.\n\n' +
    'Would you like to install JSSC to your computer? This includes:\n' +
    '- .jssc file format support;\n' +
    '- "Compress to JSSC (.jssc)" file explorer context menu button;\n' +
    '- Decompress .jssc files on open.\n\n' +
    'JSSC website and documentation: https://jssc.js.org/\n' +
    'Source code GitHub repository:\nhttps://github.com/JustDeveloper1/JSSC\n\n' +
    'To uninstall JSSC Windows integration, run "npx jssc -wu"\n(or "jssc -wu" if JSSC is installed globally) BEFORE\nUNINSTALLING NPM PACKAGE.\n\n' +
    'JSSC (JavaScript String Compressor) is an open-source\nlossless string compression algorithm.\n© 2025-2026 JustDeveloper\n\n' + 
    '[Yes] - Install JSSC Windows integration\n' + 
    '[No] - Do not install JSSC Windows integration',
repo, site)) setup().catch(err => {
    const e = "Installation failed: " + err.message;
    console.error(e, '\n' + err.trace);
    message(name__, e);
    process.exit(1);
});
