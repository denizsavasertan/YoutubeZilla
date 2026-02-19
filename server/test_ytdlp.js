const yt = require('yt-dlp-exec');

console.log('Testing yt-dlp-exec...');

yt('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    dumpSingleJson: true,
    noWarnings: true,
    noCallHome: true,
    preferFreeFormats: true,
})
    .then(output => {
        console.log('Success!');
        console.log('Title:', output.title);
    })
    .catch(err => {
        console.error('Failed!');
        console.error(err);
    });
