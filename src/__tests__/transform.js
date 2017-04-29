import test from 'ava';
import fs from 'fs';
import path from 'path';
import randomFolder from './helpers/random-folder';
import pify from 'pify';

test.beforeEach(t => {
    t.context.processStyle = require('./helpers/process-style');
});

const stat = pify(fs.stat);

function transform(fileMeta) {
    if (['jpg', 'png'].indexOf(fileMeta.ext) === -1) {
        return fileMeta;
    }

    fileMeta.contents = new Buffer('');

    return fileMeta;
}

test('should process assets via transform', t => {
    const tempFolder = randomFolder('dest', t.title);
    return t.context.processStyle('src/check-transform.css', {
        basePath: 'src',
        dest: tempFolder,
        template: '[path]/[name].[ext]',
        transform
    })
        .then(() => {
            const oldSize = fs
                .statSync(path.join('src', 'images', 'bigimage.jpg'))
                .size;

            const newSize = fs
                .statSync(path.join(tempFolder, 'images', 'bigimage.jpg'))
                .size;

            t.truthy(newSize < oldSize);
        });
});

test('should process assets via transform and use ' +
'the hash property based on the transform content', t => {
    const tempFolder = randomFolder('dest', t.title);
    return t.context.processStyle('src/check-transform-hash.css', {
        basePath: 'src',
        dest: tempFolder,
        template: '[path]/[hash].[ext]',
        transform
    })
        .then(() => {
            return stat(
                path.join(tempFolder, 'images', 'da39a3ee5e6b4b0d.jpg')
            );
        });
});

test('should not transform when the source is the same', (t) => {
    const tempFolder = randomFolder('dest', t.title);
    let times = 0;

    return t.context.processStyle('src/no-repeat-transform.css', {
        basePath: 'src',
        dest: tempFolder,
        template: '[path]/[name].[ext]',
        transform(fileMeta) {
            times++;
            return transform(fileMeta);
        }
    })
    .then(() => {
        t.truthy(times === 1);
    });
});
