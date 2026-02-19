import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

let __dirname_custom;
try {
    if (import.meta && import.meta.url) {
        const __filename = fileURLToPath(import.meta.url);
        __dirname_custom = dirname(__filename);
    }
} catch (e) {
    // ignore
}

// Fallback or use global __dirname if available (in CJS)
const effectiveDirname = __dirname_custom || (typeof __dirname !== 'undefined' ? __dirname : '');


// Determine download directory based on environment
let DOWNLOAD_DIR;
const isElectron = process.versions.electron;

if (isElectron) {
    // In Electron, use the user's Downloads folder
    DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'YoutubeZilla');
} else {
    // In dev/web mode, use local downloads folder
    DOWNLOAD_DIR = path.join(effectiveDirname, '../downloads');
}

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Configure yt-dlp binary path
const getYtDlpBinary = () => {
    if (isElectron) {
        // In production, binary is in resources/bin/yt-dlp.exe
        // process.resourcesPath points to the resources directory
        return path.join(process.resourcesPath, 'bin', 'yt-dlp.exe');
    }
    return undefined; // Let yt-dlp-exec find it in node_modules in dev
};

const binaryPath = getYtDlpBinary();

const logFile = path.join(os.homedir(), 'youtubezilla-debug.log');
const log = (message) => {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
    } catch (e) {
        // ignore
    }
};

log(`Starting YoutubeZilla downloader...`);
log(`isElectron: ${isElectron}`);
log(`process.resourcesPath: ${process.resourcesPath}`);
log(`Calculated binaryPath: ${binaryPath}`);
if (binaryPath) {
    try {
        log(`Binary exists: ${fs.existsSync(binaryPath)}`);
    } catch (e) {
        log(`Error checking binary existence: ${e.message}`);
    }
}

const runYtDlp = (url, flags) => {
    log(`runYtDlp called for URL: ${url}`);
    if (binaryPath) {
        const args = [url];
        for (const [key, value] of Object.entries(flags)) {
            if (value === true) {
                args.push(`--${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`);
            } else {
                args.push(`--${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`, value);
            }
        }

        log(`Executing binary: ${binaryPath} with args: ${JSON.stringify(args)}`);

        return new Promise((resolve, reject) => {
            execFile(binaryPath, args, (error, stdout, stderr) => {
                if (error) {
                    log(`yt-dlp error: ${stderr || error.message}`);
                    console.error('yt-dlp error:', stderr);
                    reject(error);
                } else {
                    log(`yt-dlp success`);
                    if (flags.dumpSingleJson) {
                        try {
                            resolve(JSON.parse(stdout));
                        } catch (e) {
                            log(`JSON parse error: ${e.message}`);
                            reject(e);
                        }
                    } else {
                        resolve(stdout);
                    }
                }
            });
        });
    } else {
        log(`Running in dev/node mode via yt-dlp-exec`);
        return ytdlp(url, flags);
    }
}

const getInfo = async (url) => {
    try {
        const output = await runYtDlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
        });
        return {
            title: output.title,
            thumbnail: output.thumbnail,
            duration: output.duration,
            formats: output.formats.map(f => ({
                id: f.format_id,
                ext: f.ext,
                resolution: f.resolution || f.height + 'p',
                filesize: f.filesize,
                vcodec: f.vcodec,
                acodec: f.acodec,
            })).filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
        };
    } catch (error) {
        log(`getInfo error: ${error.message}`);
        throw error;
    }
};

const downloadVideo = async (url, formatId, mode = 'video', audioFormat = 'mp3') => {
    try {
        const options = {
            output: path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'),
        };

        if (mode === 'audio') {
            options.extractAudio = true;
            options.audioFormat = audioFormat;
        } else {
            options.format = formatId || 'bestvideo+bestaudio/best';
        }

        const output = await runYtDlp(url, options);
        return output;
    } catch (error) {
        log(`downloadVideo error: ${error.message}`);
        throw error;
    }
};

export { getInfo, downloadVideo, DOWNLOAD_DIR };
