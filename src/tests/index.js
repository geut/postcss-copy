import test from 'tape';
import postcss from 'postcss';
import copy from '../index.js';
import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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

test(`default process test =>
template: 'assets/[hash].[ext]'
`, (t) => {
    deleteDest(t);
    t.plan(7);

    const copyOpts = {
        src: src,
        dest: dest,
        template: 'assets/[hash].[ext]'
    };

    processStyle('index.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('assets/b6c8f21e92b50900.jpg')),
                '@index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('assets/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@index.css => process url image (with parameters)'
            );

            return processStyle('component/index.css', copyOpts);
        })
        .then((css) => {
            t.ok(
                css.match(makeRegex('../assets/27da26a06634b050.jpg')),
                '@component/index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('../assets/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@component/index.css => process url image (with parameters)'
            );

            testFileExists(t, 'assets/b6c8f21e92b50900.jpg');
            testFileExists(t, 'assets/0ed7c955a2951f04.jpg');
            testFileExists(t, 'assets/27da26a06634b050.jpg');
        });
});

test(`process test =>
template: '[path]/[hash].[ext]'
`, (t) => {
    deleteDest(t);
    t.plan(7);

    const copyOpts = {
        src: src,
        dest: dest,
        template: '[path]/[hash].[ext]'
    };

    processStyle('index.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('images/b6c8f21e92b50900.jpg')),
                '@index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('images/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@index.css => process url image (with parameters)'
            );
            return processStyle('component/index.css', copyOpts);
        })
        .then((css) => {
            t.ok(
                css.match(makeRegex('images/27da26a06634b050.jpg')),
                '@component/index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('../images/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@component/index.css => process url image (with parameters)'
            );

            testFileExists(t, 'images/b6c8f21e92b50900.jpg');
            testFileExists(t, 'images/0ed7c955a2951f04.jpg');
            testFileExists(t, 'component/images/27da26a06634b050.jpg');
        });
});

test(`process test =>
template: '[path]/[name].[ext]'
`, (t) => {
    deleteDest(t);
    t.plan(7);

    const copyOpts = {
        src: src,
        dest: dest,
        template: '[path]/[name].[ext]'
    };

    processStyle('index.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('images/other.jpg')),
                '@index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('images/test.jpg?#iefix&v=4.4.0')
                ),
                '@index.css => process url image (with parameters)'
            );
            return processStyle('component/index.css', copyOpts);
        })
        .then((css) => {
            t.ok(
                css.match(makeRegex('images/component.jpg')),
                '@component/index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('../images/test.jpg?#iefix&v=4.4.0')
                ),
                '@component/index.css => process url image (with parameters)'
            );

            testFileExists(t, 'images/other.jpg');
            testFileExists(t, 'images/test.jpg');
            testFileExists(t, 'component/images/component.jpg');
        });
});

test(`process test =>
template: 'assets/[hash].[ext]',
keepRelativePath: false
`, (t) => {
    deleteDest(t);
    t.plan(7);

    const copyOpts = {
        src: src,
        dest: dest,
        keepRelativePath: false
    };

    processStyle('index.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('assets/b6c8f21e92b50900.jpg')),
                '@index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('assets/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@index.css => process url image (with parameters)'
            );
            return processStyle('component/index.css', copyOpts);
        })
        .then((css) => {
            t.ok(
                css.match(makeRegex('assets/27da26a06634b050.jpg')),
                '@component/index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('assets/0ed7c955a2951f04.jpg?#iefix&v=4.4.0')
                ),
                '@component/index.css => process url image (with parameters)'
            );

            testFileExists(t, 'assets/b6c8f21e92b50900.jpg');
            testFileExists(t, 'assets/0ed7c955a2951f04.jpg');
            testFileExists(t, 'assets/27da26a06634b050.jpg');
        });
});

test(`process test =>
template: 'assets/[hash].[ext]',
hashFunction: {custom}
`, (t) => {
    deleteDest(t);
    t.plan(7);

    const copyOpts = {
        src: src,
        dest: dest,
        hashFunction(content) {
            // borschik
            return crypto.createHash('sha1')
                .update(content)
                .digest('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
                .replace(/^[+-]+/g, '');
        }
    };

    processStyle('index.css', copyOpts)
        .then((css) => {
            t.ok(
                css.match(makeRegex('assets/tsjyHpK1CQAzLrWA3hok0f01nks.jpg')),
                '@index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('assets/DtfJVaKVHwRz_PkVXOweAq13S0o.jpg' +
                        '?#iefix&v=4.4.0')
                ),
                '@index.css => process url image (with parameters)'
            );
            return processStyle('component/index.css', copyOpts);
        })
        .then((css) => {
            t.ok(
                css.match(
                    makeRegex('../assets/J9omoGY0sFB4U5nyxLRB6t3Ms7w.jpg')
                ),
                '@component/index.css => process url image (simple)'
            );
            t.ok(
                css.match(
                    makeRegex('../assets/DtfJVaKVHwRz_PkVXOweAq13S0o.jpg' +
                        '?#iefix&v=4.4.0')
                ),
                '@component/index.css => process url image (with parameters)'
            );

            testFileExists(t, 'assets/tsjyHpK1CQAzLrWA3hok0f01nks.jpg');
            testFileExists(t, 'assets/DtfJVaKVHwRz_PkVXOweAq13S0o.jpg');
            testFileExists(t, 'assets/J9omoGY0sFB4U5nyxLRB6t3Ms7w.jpg');
        });
});
