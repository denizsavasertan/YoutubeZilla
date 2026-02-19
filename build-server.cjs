const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['server/index.js'],
    bundle: true,
    platform: 'node',
    target: 'node16', // Electron's Node version
    outfile: 'dist-server/index.cjs',
    format: 'cjs',
    external: ['electron'],
}).then(() => {
    console.log('Server bundled successfully to dist-server/index.cjs');
}).catch(() => process.exit(1));
