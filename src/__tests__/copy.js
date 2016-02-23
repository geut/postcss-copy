import test from 'ava';
import path from 'path';
import fs from 'fs';
import randomFolder from './helpers/random-folder';
import copy from '../lib/copy';

test('should copy file', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = 'src/images/test.jpg';
    const destFile = path.join(tempFolder, 'test.jpg');

    return copy(srcFile, destFile).then(() => {
        const srcBuffer = fs.readFileSync(srcFile);
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(srcBuffer, destBuffer);
        t.is(compared, 0);
    });
});

test('should copy file with dynamical dest', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = 'src/images/test.jpg';
    const destFile = path.join(tempFolder, 'test.jpg');

    return copy(srcFile, () => destFile).then(() => {
        const srcBuffer = fs.readFileSync(srcFile);
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(srcBuffer, destBuffer);
        t.is(compared, 0);
    });
});

test('should copy and transform file', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = 'src/images/test.jpg';
    const destFile = path.join(tempFolder, 'test.jpg');
    const srcBuffer = fs.readFileSync(srcFile);
    const customBuffer = new Buffer([1, 2, 3, 4, 5]);

    return copy(srcFile, destFile, contents => {
        const compared = Buffer.compare(srcBuffer, contents);
        t.is(compared, 0);
        return customBuffer;
    }).then(() => {
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(destBuffer, customBuffer);
        t.is(compared, 0);
    });
});

test('should copy file once', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = 'src/images/test.jpg';
    const destFile = path.join(tempFolder, 'test.jpg');
    let prevTime;

    return copy(srcFile, destFile).then(() => {
        prevTime = fs.statSync(destFile).mtime.getTime();
        return copy(srcFile, destFile);
    })
    .then(() => {
        t.is(prevTime, fs.statSync(destFile).mtime.getTime());
    });
});

test('should copy again if source was modified', t => {
    const tempFolder = randomFolder('dest', t.title);
    const srcFile = 'src/images/test-modified.jpg';
    const destFile = path.join(tempFolder, 'test.jpg');
    const srcBuffer = fs.readFileSync(srcFile);
    const modifiedBuffer = new Buffer([srcBuffer, srcBuffer]);

    return copy(srcFile, destFile).then(() => {
        fs.writeFileSync(srcFile, modifiedBuffer);
        return copy(srcFile, destFile);
    })
    .then(() => {
        fs.writeFileSync(srcFile, srcBuffer);
        const destBuffer = fs.readFileSync(destFile);
        const compared = Buffer.compare(modifiedBuffer, destBuffer);
        t.is(compared, 0);
    });
});
