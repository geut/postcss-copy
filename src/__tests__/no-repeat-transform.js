import test from 'ava';
import Jimp from 'jimp';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';

test('should not transform when the source is the same', (t) => {
    const tempFolder = randomFolder('dest', t.title);
    let times = 0;

    return processStyle('src/no-repeat-transform.css', {
        src: 'src',
        dest: tempFolder,
        template: '[path]/[name].[ext]',
        transform(fileMeta) {
            times++;
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
        t.truthy(times === 1);
    });
});
