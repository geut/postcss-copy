import fs from 'fs';
import path from 'path';
import pify from 'pify';
import mkdirp from 'mkdirp';

const mkdir = pify(mkdirp);
const writeFile = pify(fs.writeFile);
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);
const cacheReader = {};
const cacheWriter = {};

function checkOutput(file) {
    if (cacheWriter[file]) {
        return cacheWriter[file].then(() => stat(file));
    }

    return stat(file);
}

function write(file, contents) {
    cacheWriter[file] = mkdir(path.dirname(file)).then(() => {
        return writeFile(file, contents);
    });

    return cacheWriter[file];
}

export default function copy(
    input,
    output,
    transform = (contents) => contents
) {
    let isModified;
    let mtime;

    return stat(input)
        .catch(() => {
            throw Error(`Can't read the file in ${input}`);
        })
        .then(stats => {
            const item = cacheReader[input];
            mtime = stats.mtime.getTime();

            if (item && item.mtime === mtime) {
                return item
                    .contents
                    .then(transform);
            }

            isModified = true;
            const fileReaded = readFile(input)
                .then(contents => transform(contents, isModified));

            cacheReader[input] = {
                mtime,
                contents: fileReaded
            };

            return fileReaded;
        })
        .then(contents => {
            if (typeof output === 'function') {
                output = output();
            }

            if (isModified) {
                return write(output, contents);
            }

            return checkOutput(output).then(() => {
                return;
            }, () => {
                return write(output, contents);
            });
        });
}

