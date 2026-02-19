# YoutubeZilla

A powerful, standalone desktop application for downloading YouTube videos and audio in maximum resolution.

![Screenshot](src/assets/Logo.jpg)

## Features
- **High Quality Downloads**: Uses `yt-dlp` to fetch the best available video and audio streams.
- **Audio Extraction**: Download MP3 or WAV audio directly.
- **Playlist Protection**: Prevents accidental playlist downloads.
- **Standalone**: Bundled server and dependencies for easy installation.
- **Secure**: Runs locally on your machine.

## Installation
1. Download the latest `YoutubeZilla Setup.exe` from releases.
2. Run the installer (installs to Program Files).
3. Launch YoutubeZilla and start downloading!

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run dist
```

## Tech Stack
- Electron
- React + Vite
- Express (Backend)
- yt-dlp (Core Downloader)
