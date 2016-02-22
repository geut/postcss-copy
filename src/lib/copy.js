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

function readCached(file) {
    return stat(file).then(stats => {
        const item = cache[file];
        const mtime = stats.mtime.getTime();

        if (item && item.mtime === mtime) {
            return item.contents;
        }

        return read(file, mtime);
    });
}

function write(file, contents, transform) {
    return mkdir(path.dirname(file)).then(() => {
        return transform ? transform(contents) : contents;
    })
    .then(transformedContens => {
        return writeFile(file, transformedContens);
    });
}

export default function copy(input, output, transform) {
    return stat(output).then(() => {
        return stat(input).then(stats => {
            const item = cache[input];
            const mtime = stats.mtime.getTime();

            if (item && item.mtime === mtime) {
                return Promise.resolve();
            }

            return read(input, mtime).then(contents => {
                return write(output, contents, transform);
            });
        });
    }, () => {
        return readCached(input).then(contents => {
            return write(output, contents, transform);
        });
    });
}
