import test from 'tape';
import postcss from 'postcss';
import copy from '../index.js';
import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {_extend} from 'util';

const src = 'src/tests/src';
const dest = 'src/tests/dest';

/**
 * processStyle
 * @param  {string} filename e.g: index.css
 * @param  {Object} opts = {} e.g: {src: src, dest: dest}
 * @return {string}
 */
function processStyle(filename, opts = {}) {
    const file = fs
        .readFileSync(path.join(src, filename), 'utf8')
        .trim();

    return postcss()
        .use(copy(opts))
        .process(file, {
            from: path.join(src, filename)
        })
        .then((result) => {
            return result.css;
        });
}

function makeRegex(str) {
    return new RegExp(
        ('\'' + str + '\'')
        .replace(/\//g, '\\\/')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?')
    );
}

function testFileExists(t, file) {
    pathExists(path.join(dest, file))
        .then((exists) => {
            t.ok(exists, `File "${file}" created.`);
        });
}

function deleteDest(pathDest = 'src/tests/dest') {
    if (fs.existsSync(pathDest)) {
        fs.readdirSync(pathDest).forEach((file) => {
            const curPath = pathDest + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteDest(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(pathDest);
    }
}

test('options test', (t) => {
    t.throws(() => {
        processStyle('index.css');
    },
        /undefined/,
        'Throw an exception if the `src` option is not setted.'
    );

    t.throws(() => {
        processStyle('index.css', {
            src: 'setted'
        });
    },
        /undefined/,
        'Throw an exception if the `dest` option is not setted.'
    );

    t.end();
});

test(`invalid url() test`, (t) => {
    deleteDest(t);
    t.plan(2);

    const copyOpts = {
        src: src,
        dest: dest
    };

    processStyle('invalid.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('assets/b6c8f21e92b50900.jpg')) &&
                css.match(makeRegex('data:image/gif;base64,R0lGOD')),
                '@invalid.css => Ignore if the url() is not valid.'
            );
        })
        .catch((err) => {
            t.fail(`@invalid.css => ${err}`);
        });

    processStyle('not-found.css', copyOpts)
        .then((css) => {
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
        deleteDest(t);
        t.plan(7);

        if (cTest.opts.hashFunction === 'custom') {
            cTest.opts.hashFunction = (content) => {
                // borschik
                return crypto.createHash('sha1')
                    .update(content)
                    .digest('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '')
                    .replace(/^[+-]+/g, '');
            };
        }
        const copyOpts = _extend({
            src: src,
            dest: dest
        }, cTest.opts);

        processStyle('index.css', copyOpts)
            .then((css) => {
                cTest.assertions.index.forEach((assertion) => {
                    t.ok(
                        css.match(makeRegex(assertion.match)),
                        assertion.desc
                    );
                });

                return processStyle('component/index.css', copyOpts);
            })
            .then((css) => {
                cTest.assertions.component.forEach((assertion) => {
                    t.ok(
                        css.match(makeRegex(assertion.match)),
                        assertion.desc
                    );
                });

                cTest.assertions.exists.forEach((file) => {
                    testFileExists(t, file);
                });
            });
    });
});
