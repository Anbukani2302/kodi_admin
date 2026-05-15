const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('d:\\KODI Genealogy Admin Dashboard\\src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Replace indigo and blue tailwind utilities with red
        let newContent = content.replace(/indigo-(\d+)/g, 'red-$1').replace(/blue-(\d+)/g, 'red-$1').replace(/amber-(\d+)/g, 'red-$1');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log('Updated', filePath);
        }
    }
});
