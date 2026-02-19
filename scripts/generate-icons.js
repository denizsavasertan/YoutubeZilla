import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../src/assets/Logo.jpg');
const buildDir = path.join(__dirname, '../build');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

async function generate() {
    console.log('Generating icons...');

    // Icon.png (512x512) for Electron
    await sharp(src)
        .resize(512, 512)
        .png()
        .toFile(path.join(buildDir, 'icon.png'));
    console.log('Generated build/icon.png');

    // Icon.ico (256x256) for Windows
    // Use png-to-ico to convert the generated png to ico
    try {
        const buf = await pngToIco(path.join(buildDir, 'icon.png'));
        fs.writeFileSync(path.join(buildDir, 'icon.ico'), buf);
        console.log('Generated build/icon.ico');
    } catch (e) {
        console.error('Error generating ICO:', e);
    }
}

generate().catch(err => {
    console.error(err);
    process.exit(1);
});
