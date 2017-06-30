import test from 'ava';
import path from 'path';
import fs from 'fs';
import randomFolder from './helpers/random-folder';
import pify from 'pify';

test.beforeEach(t => {
    t.context.copy = require('../lib/copy');
    t.context.cwd = 'src/__tests__';
});

test('should copy file', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');

    return t.context.copy(srcFile, destFile).then(() => {
        const srcBuffer = fs.readFileSync(srcFile);
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(srcBuffer, destBuffer);
        t.is(compared, 0);
    });
});

test('should copy file with dynamical dest', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');

    return t.context.copy(srcFile, () => destFile).then(() => {
        const srcBuffer = fs.readFileSync(srcFile);
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(srcBuffer, destBuffer);
        t.is(compared, 0);
    });
});

test('should copy and transform file', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');
    const srcBuffer = fs.readFileSync(srcFile);
    const customBuffer = new Buffer([1, 2, 3, 4, 5]);

    return t.context.copy(srcFile, destFile, contents => {
        const compared = Buffer.compare(srcBuffer, contents);
        t.is(compared, 0);
        return customBuffer;
    })
        .then(() => {
            const destBuffer = fs.readFileSync(destFile);
            const compared = Buffer.compare(destBuffer, customBuffer);
            t.is(compared, 0);
        });
});

test('should copy file once', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');
    let prevTime;

    return t.context.copy(srcFile, destFile).then(() => {
        prevTime = fs.statSync(destFile).mtime.getTime();
        return t.context.copy(srcFile, destFile);
    })
        .then(() => {
            t.is(prevTime, fs.statSync(destFile).mtime.getTime());
        });
});

test('should copy file if source was not modified ' +
   'but the file is missing in the destination', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');

    const process = t.context.copy(srcFile, destFile)
        .then(() => pify(fs.unlink)(destFile))
        .then(() => t.context.copy(srcFile, destFile))
        .then(() => pify(fs.stat)(destFile));

    return t.notThrows(process);
});

test('should copy again if source was modified', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = `${t.context.cwd}/src/images/test-modified.jpg`;
    const destFile = path.join(tempFolder, 'test.jpg');
    const srcBuffer = fs.readFileSync(srcFile);
    const modifiedBuffer = new Buffer([srcBuffer, srcBuffer]);

    return t.context.copy(srcFile, destFile).then(() => {
        fs.writeFileSync(srcFile, modifiedBuffer);
        return t.context.copy(srcFile, destFile);
    })
        .then(() => {
            fs.writeFileSync(srcFile, srcBuffer);
            const destBuffer = fs.readFileSync(destFile);
            const compared = Buffer.compare(modifiedBuffer, destBuffer);
            t.is(compared, 0);
        });
});
