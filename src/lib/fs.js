import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

export function writeFile(file, contents) {
    return new Promise((resolve, reject) => {
        mkdirp(path.dirname(file), err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, contents, err => {
                if (err) {
                    reject(Error(`Can't write in ${file}`));
                } else {
                    resolve();
                }
            });
        });
    });
}

export function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, contents) => {
            if (err) {
                reject(Error(`Can't read the file in ${file}`));
            } else {
                resolve(contents);
            }
        });
    });
}
