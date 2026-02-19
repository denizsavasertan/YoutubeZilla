import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Safe directory detection for both ESM and CJS
let effectiveDirname;
try {
    if (typeof __dirname !== 'undefined') {
        effectiveDirname = __dirname;
    } else if (import.meta && import.meta.url) {
        const __filename = fileURLToPath(import.meta.url);
        effectiveDirname = dirname(__filename);
    } else {
        effectiveDirname = '';
    }
} catch (e) {
    effectiveDirname = '';
}


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
        return path.join(process.resourcesPath, 'bin', 'yt-dlp.exe');
    }
    return undefined; // Let yt-dlp-exec find it in node_modules in dev
};

// Configure ffmpeg binary path
const getFfmpegBinary = () => {
    if (isElectron) {
        return path.join(process.resourcesPath, 'bin', 'ffmpeg.exe');
    }
    return undefined; // Let yt-dlp find it in PATH or node_modules
};

const binaryPath = getYtDlpBinary();
const ffmpegPath = getFfmpegBinary();

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
log(`Calculated ffmpegPath: ${ffmpegPath}`);

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

        // Explicitly set ffmpeg location if available
        if (ffmpegPath && fs.existsSync(ffmpegPath)) {
            args.push('--ffmpeg-location', ffmpegPath);
        }

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
                container: f.container,
            })).filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
        };
    } catch (error) {
        log(`getInfo error: ${error.message}`);
        throw error;
    }
};

const downloadVideo = async (url, formatId, mode = 'video', audioFormat = 'mp3', container = 'mp4') => {
    try {
        const options = {
            output: path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'),
            restrictFilenames: true, // Prevent special characters in filenames
            forceOverwrites: true,   // Overwrite existing files
        };

        if (mode === 'audio') {
            options.extractAudio = true;
            options.audioFormat = audioFormat;
        } else {
            // For video, we want the best quality (often 4K/VP9) but merged into the requested container
            // 'bestvideo+bestaudio/best' gets the highest quality streams.
            options.format = formatId || 'bestvideo+bestaudio/best';
            options.mergeOutputFormat = container;
        }

        const output = await runYtDlp(url, options);
        return output;
    } catch (error) {
        log(`downloadVideo error: ${error.message}`);
        throw error;
    }
};

export { getInfo, downloadVideo, DOWNLOAD_DIR };
