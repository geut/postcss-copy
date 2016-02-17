import test from 'tape';
import postcss from 'postcss';
import copy from '../index.js';
import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Jimp from 'jimp';
import escapeStringRegexp from 'escape-string-regexp';
import del from 'del';

process.chdir('src/tests');

/**
 * processStyle
 * @param  {string} filename e.g: index.css
 * @param  {Object} opts = {} e.g: {src: src, dest: dest}
 * @return {string}
 */
function processStyle(filename, opts = {}) {
    const file = fs
        .readFileSync(filename, 'utf8')
        .trim();

    return postcss()
        .use(copy(opts))
        .process(file, {
            from: filename
        });
}

function makeRegex(str, simple = false) {
    let value;
    if (simple) {
        value = str;
    } else {
        value = '(\'' + str + '\')';
    }
    return new RegExp(escapeStringRegexp(value));
}

function testFileExists(t, file) {
    return pathExists(path.join('dest', file))
        .then((exists) => {
            t.ok(exists, `File "${file}" created.`);
        });
}

del.sync('dest');

test('options test', (t) => {
    t.plan(4);

    processStyle(
        'src/index.css'
    )
    .then(() => {
        t.fail('Throw an exception if the "src" option is not setted.');
    }, () => {
        t.pass('Throw an exception if the "src" option is not setted.');
    });

    processStyle(
        'src/index.css',
        {
            src: 'setted'
        }
    )
    .then(() => {
        t.fail('Throw an exception if the "dest" option is not setted.');
    }, () => {
        t.pass('Throw an exception if the "dest" option is not setted.');
    });

    processStyle(
        'external_libs/bootstrap/css/bootstrap.css',
        {
            src: 'src',
            dest: 'dest'
        }
    )
    .then((result) => {
        const warnings = result.warnings();
        t.equal(warnings.length, 6);
        t.equal(
            warnings[0].text.indexOf('"src" not found in '),
            0,
            'Warning if the filename not belongs to the "src" option.'
        );
    });
});

test('invalid url() test', (t) => {
    t.plan(2);

    const copyOpts = {
        src: 'src',
        dest: 'dest'
    };

    processStyle('src/invalid.css', copyOpts)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('assets/b6c8f21e92b50900.jpg')) &&
                css.match(makeRegex('data:image/gif;base64,R0lGOD')),
                '@invalid.css => Ignore if the url() is not valid.'
            );
        })
        .catch((err) => {
            t.fail(`@invalid.css => ${err}`);
        });

    processStyle('src/not-found.css', copyOpts)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('assets/b6c8f21e92b50900.jpg')) &&
                css.match(makeRegex('images/image-not-found.jpg')),
                '@not-found.css => Ignore if the asset is not found ' +
                'in the src path.'
            );
        })
        .catch((err) => {
            t.fail(`@not-found.css => ${err}`);
        });
});


import commonTests from './common-tests.json';

commonTests.forEach((cTest) => {
    test(cTest.name, (t) => {
        t.plan(21);

        if (cTest.opts.hashFunction === 'custom') {
            cTest.opts.hashFunction = (contents) => {
                // borschik
                return crypto.createHash('sha1')
                    .update(contents)
                    .digest('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/\=/g, '')
                    .replace(/^[+-]+/g, '');
            };
        }
        if (cTest.opts.inputPath) {
            cTest.opts.inputPath = (decl) => {
                return path.dirname(decl.source.input.file);
            };
        }

        if (cTest.opts.relativePath === false) {
            cTest.opts.relativePath = (dirname, fileMeta, result, options) => {
                return result.opts.to || options.dest;
            };
        }
        const copyOpts = Object.assign({
            src: 'src',
            dest: 'dest'
        }, cTest.opts);

        let oldTime;
        let newTime;

        processStyle('src/index.css', copyOpts)
            .then((result) => {
                const css = result.css;
                cTest.assertions.index.forEach((assertion) => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                oldTime = fs.statSync(
                    path.join('dest', cTest.assertions['no-modified'])
                ).mtime.getTime();

                copyOpts.src = ['src', 'external_libs'];
                t.comment('*************************************************');
                t.comment(`from now testing with multiple src: ${
                    JSON.stringify(copyOpts.src)
                }`);
                t.comment('*************************************************');
                return processStyle(
                    'src/component/index.css',
                    copyOpts
                );
            })
            .then((result) => {
                const css = result.css;
                cTest.assertions.component.forEach((assertion) => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                newTime = fs.statSync(
                    path.join('dest', cTest.assertions['no-modified'])
                ).mtime.getTime();

                t.ok(
                    oldTime === newTime,
                    `${cTest.assertions['no-modified']} was not modified.`
                );

                return processStyle(
                    'external_libs/bootstrap/css/bootstrap.css',
                    copyOpts
                );
            })
            .then((result) => {
                const css = result.css;
                cTest.assertions.external_libs.forEach((assertion) => {
                    t.ok(
                        css.match(makeRegex(
                            assertion.match,
                            assertion['regex-simple']
                        )),
                        assertion.desc
                    );
                });

                newTime = fs.statSync(
                    path.join('dest', cTest.assertions['no-modified'])
                ).mtime.getTime();

                t.ok(
                    oldTime === newTime,
                    `${cTest.assertions['no-modified']} was not modified.`
                );

                cTest.assertions.exists.forEach((file) => {
                    testFileExists(t, file);
                });
            })
            .catch((err) => {
                t.fail(err);
            });
    });
});

test('check-transform', (t) => {
    t.plan(1);

    const copyOpts = {
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
                .then((lenna) => {
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
    };

    processStyle('src/check-transform.css', copyOpts)
        .then(() => {
            const oldSize = fs
                .statSync('src/images/bigimage.jpg')
                .size;

            const newSize = fs
                .statSync('dest/images/bigimage.jpg')
                .size;

            t.ok(
                newSize < oldSize,
                'Optimize bigimage.jpg'
            );
        });
});

test('check-correct-parse-url', (t) => {
    t.plan(1);

    const copyOpts = {
        src: 'src',
        dest: 'dest',
        template: '[path]/[name].[ext]'
    };

    processStyle('src/correct-parse-url.css', copyOpts)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('fonts/MaterialIcons-Regular.woff')) &&
                css.match(makeRegex('fonts/MaterialIcons-Regular.woff2')),
                'Parse url'
            );
        });
});

test('check-function-template', (t) => {
    t.plan(1);

    const copyOpts = {
        src: 'src',
        dest: 'dest',
        template(fileMeta) {
            return 'custom-path/custom-name-' +
            fileMeta.name + '.' + fileMeta.ext;
        }
    };

    processStyle('src/index.css', copyOpts)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('custom-path/custom-name-test.jpg' +
                '?#iefix&v=4.4.0')) &&
                css.match(makeRegex('custom-path/custom-name-other.jpg')),
                'Function template'
            );
        });
});

test('check-ignore-option', (t) => {
    t.plan(3);

    const copyOptsString = {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-array/[path]/[name].[ext]',
        ignore: 'images/other.+(jpg|png)'
    };

    processStyle('src/ignore.css', copyOptsString)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('images/test.jpg?#iefix&v=4.4.0')) &&
                css.match(makeRegex('images/other.jpg')) &&
                css.match(makeRegex('ignore-path-array/images/noignore.jpg')),
                'Ignore files with string expression'
            );
        });

    const copyOptsArray = {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-array/[path]/[name].[ext]',
        ignore: ['images/other.jpg']
    };

    processStyle('src/ignore.css', copyOptsArray)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('images/test.jpg?#iefix&v=4.4.0')) &&
                css.match(makeRegex('images/other.jpg')) &&
                css.match(makeRegex('ignore-path-array/images/noignore.jpg')),
                'Ignore files with array<string> of paths'
            );
        });

    const copyOptsFunc = {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-func/[path]/[name].[ext]',
        ignore(filename) {
            return filename === 'images/other.jpg';
        }
    };

    processStyle('src/ignore.css', copyOptsFunc)
        .then((result) => {
            const css = result.css;
            t.ok(
                css.match(makeRegex('images/test.jpg?#iefix&v=4.4.0')) &&
                css.match(makeRegex('images/other.jpg')) &&
                css.match(makeRegex('ignore-path-func/images/noignore.jpg')),
                'Ignore files with custom function'
            );
        });
});
