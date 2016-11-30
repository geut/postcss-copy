import test from 'ava';
import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';
import pify from 'pify';

const stat = pify(fs.stat);

function transform(fileMeta) {
    const ext = {
        png: Jimp.MIME_PNG,
        jpg: Jimp.MIME_JPEG
    };
    if (['jpg', 'png'].indexOf(fileMeta.ext) === -1) {
        return fileMeta;
    }
    return Jimp
        .read(fileMeta.contents)
        .then(lenna => {
            return new Promise((resolve, reject) => {
                lenna
                .resize(10, 10)
                .quality(60)
                .getBuffer(ext[fileMeta.ext], (err, buffer) => {
                    if (err) {
                        reject(err);
                    }
                    fileMeta.contents = buffer;
                    return resolve(fileMeta);
                });
            });
        });
}

test('should process assets via transform', t => {
    const tempFolder = randomFolder('dest', t.title);
    return processStyle('src/check-transform.css', {
        src: 'src',
        dest: tempFolder,
        template: '[path]/[name].[ext]',
        transform
    })
        .then(() => {
            const oldStat = stat(
                path.join('src', 'images', 'bigimage.jpg')
            );
            const newStat = stat(
                path.join(tempFolder, 'images', 'bigimage.jpg')
            );

            return Promise.all([oldStat, newStat]);
        })
        .then((results) => {
            const [oldStat, newStat] = results;
            return t.truthy(newStat.size < oldStat.size);
        });
});

test(`should process assets via transform and use
the hash property based on the transform content`, t => {
    const tempFolder = randomFolder('dest', t.title);
    return processStyle('src/check-transform.css', {
        src: 'src',
        dest: tempFolder,
        template: '[path]/[hash].[ext]',
        transform
    })
        .then(() => {
            return stat(
                path.join(tempFolder, 'images', 'a23a149402afd438.jpg')
            );
        });
});
