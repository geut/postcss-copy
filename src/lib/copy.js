import fs from 'fs';
import path from 'path';
import pify from 'pify';
import mkdirp from 'mkdirp';

const mkdir = pify(mkdirp);
const writeFile = pify(fs.writeFile);
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);
const cache = {};

function read(file, mtime) {
    const contents = readFile(file);

    cache[file] = {
        mtime,
        contents
    };

    return contents;
}

function write(file, contents) {
    return mkdir(path.dirname(file)).then(() => {
        return writeFile(file, contents);
    });
}

export default function copy(input, output, transform) {
    let isModified;

    return stat(input).catch(() => {
        throw Error(`Can't read the file in ${input}`);
    })
    .then(stats => {
        const item = cache[input];
        const mtime = stats.mtime.getTime();

        if (item && item.mtime === mtime) {
            return item.contents;
        }

        isModified = true;
        return read(input, mtime);
    })
    .then(contents => transform ? transform(contents, isModified) : contents)
    .then(contents => {
        if (typeof output === 'function') {
            output = output();
        }
        if (isModified) {
            return write(output, contents);
        }
        return stat(output).then(() => {
            return;
        }, () => {
            return write(output, contents);
        });
    });
}
