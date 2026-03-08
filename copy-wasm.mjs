import fs from 'fs';
import path from 'path';

const srcDir = './node_modules/web-ifc';
const destDir = './public';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

const files = ['web-ifc.wasm', 'web-ifc-mt.wasm'];

files.forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    console.log(`Copied ${file} to public/`);
});
