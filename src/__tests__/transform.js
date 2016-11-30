import test from 'ava';
import fs from 'fs';
import Imagemin from 'imagemin';
import imageminJpegoptim from 'imagemin-jpegoptim';
import path from 'path';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';
import pify from 'pify';

const stat = pify(fs.stat);

function transform(fileMeta) {
    if (['jpg', 'png'].indexOf(fileMeta.ext) === -1) {
        return fileMeta;
    }
    return Imagemin.buffer(fileMeta.contents, {
        plugins: [
            imageminJpegoptim({
                size: '1%'
            })
        ]
    })
        .then(result => {
            fileMeta.contents = result;
            return fileMeta;
        })
        .catch(err => console.log(err));
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
