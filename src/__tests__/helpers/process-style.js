import fs from 'fs';
import postcss from 'postcss';
import copy from '../../index.js';

export default function processStyle(filename, opts, to) {
    return new Promise((resolve, reject) => {
        fs.readFile(`src/__tests__/${filename}`, 'utf8', (err, file) => {
            if (err) {
                reject(err);
            } else {
                resolve(file);
            }
        });
    })
        .then(file => {
            const postcssOpts = {
                from: `src/__tests__/${filename}`,
                to
            };
            if (opts.basePath) {
                const { basePath } = opts;
                if (typeof opts.basePath === 'string') {
                    opts.basePath = basePath.indexOf('src/__tests__') === -1 ?
                        `src/__tests__/${basePath}` :
                        basePath;
                } else {
                    opts.basePath = basePath
                        .map(bPath => {
                            return bPath.indexOf('src/__tests__') === -1 ?
                                `src/__tests__/${bPath}` :
                                bPath;
                        });
                }
            }
            return postcss([
                copy(opts)
            ]).process(file.trim(), postcssOpts);
        });
}
