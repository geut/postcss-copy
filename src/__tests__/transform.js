import test from 'ava';
import fs from 'fs';
import Jimp from 'jimp';
import processStyle from './helpers/process-style.js';

test('should process assets via transform', t => {
    return processStyle('src/check-transform.css', {
        src: 'src',
        dest: 'dest',
        template: '[path]/[name].[ext]',
        transform(fileMeta) {
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
    })
    .then(() => {
        const oldSize = fs
            .statSync('src/images/bigimage.jpg')
            .size;

        const newSize = fs
            .statSync('dest/images/bigimage.jpg')
            .size;

        t.ok(newSize < oldSize);
    });
});
