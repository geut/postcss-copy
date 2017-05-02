import fs from 'fs';
import postcss from 'postcss';
import copy from '../../index.js';

export default function processStyle(filename, opts, to) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, file) => {
            if (err) {
                reject(err);
            } else {
                resolve(file);
            }
        });
    })
        .then(file => {
            const postcssOpts = {
                from: filename,
                to
            };

            return postcss([
                copy(opts)
            ]).process(file.trim(), postcssOpts);
        });
}
