import fs from 'fs';
import postcss from 'postcss';
import copy from '../../index.js';

export default function processStyle(filename, opts) {
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
        return postcss([
            copy(opts)
        ])
        .process(file.trim(), {
            from: filename
        });
    });
}
