#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, "./ui");
const confirmPs1 = path.resolve(uiDir, "./confirm.ps1");
const welcomePs1 = path.resolve(uiDir, "./welcome.ps1");
const compresPs1 = path.resolve(__dirname, "./windows/ui/compress.ps1");

export function confirm(title, text, repo, site) {
    try {
        const lines = text.replace(/`/g, '``').replace(/\$/g, '`$').replace(/"/g, '\\"').split(/(\n\n|\n)/g).filter(a=>a&&a!='\n'&&a!='\n\n');
        
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${confirmPs1}" -Title "${title}" ${
            (()=>{
                let out = [];
                let id = 1;
                for (const line of lines) {
                    out.push(`-Line${id++} "${line}"`);
                }
                return out.join(' ');
            })()
        } -Repo "${repo}" -Site "${site}"`;
        
        const result = execSync(cmd).toString().trim();
        return result === 'True';
    } catch (e) {
        return false;
    }
}

export function welcome(title, text, repo, site) {
    try {
        const lines = text.replace(/`/g, '``').replace(/\$/g, '`$').replace(/"/g, '\\"').split(/(\n\n|\n)/g).filter(a=>a&&a!='\n'&&a!='\n\n');
        
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${welcomePs1}" -Title "${title}" ${
            (()=>{
                let out = [];
                let id = 1;
                for (const line of lines) {
                    out.push(`-Line${id++} "${line}"`);
                }
                return out.join(' ');
            })()
        } -Repo "${repo}" -Site "${site}"`;
        
        const result = execSync(cmd).toString().trim();
        return result === 'True';
    } catch (e) {
        return false;
    }
}

export function compress(title, name, icon, config) {
    try {
        const cd = {
            1: config.JUSTC,
            2: config.recursiveCompression,
            3: config.segmentation,
            4: config.base64IntegerEncoding,
            5: config.base64Packing,
            6: config.offsetEncoding,
            7: config.lzstring,
        }

        const cmd = `pwsh -ExecutionPolicy Bypass -File "${compresPs1}" ` +
                    `-IconPath "${icon}" ` +
                    `-CheckDefault1 ${cd[1] ? 1 : 0} ` +
                    `-Title "${title}" ` +
                    `-FileName "${name}" ` +
                    `-CheckDefault2 ${cd[2] ? 1 : 0} ` +
                    `-CheckDefault3 ${cd[3] ? 1 : 0} ` +
                    `-CheckDefault4 ${cd[4] ? 1 : 0} ` +
                    `-CheckDefault5 ${cd[5] ? 1 : 0} ` +
                    `-CheckDefault6 ${cd[6] ? 1 : 0} ` +
                    `-CheckDefault7 ${cd[7] ? 1 : 0}`;

        const stdout = execSync(cmd).toString();
        
        if (stdout) {
            const result = JSON.parse(stdout.trim());
            return [true, result];
        }
    } catch {
        return [false, null];
    }
}
