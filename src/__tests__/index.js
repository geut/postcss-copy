import test from 'ava';
import pathExists from 'path-exists';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import randomFolder from './helpers/random-folder';
import makeRegex from './helpers/make-regex';
import commonTests from './common-tests.json';

test.beforeEach(t => {
    t.context.processStyle = require('./helpers/process-style');
});

function testFileExists(t, file) {
    return pathExists(file).then(exists => {
        t.truthy(exists, `File "${file}" created.`);
    });
}

commonTests.forEach((item, key) => {
    if (key > 0) {
        return;
    }
    if (item.opts.hashFunction === 'custom') {
        item.opts.hashFunction = contents => {
            // borschik
            return crypto
                .createHash('sha1')
                .update(contents)
                .digest('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/\=/g, '')
                .replace(/^[+-]+/g, '');
        };
    }

    test(item.name, t => {
        const tempFolder = randomFolder('dest', t.title);
        const copyOpts = Object.assign(
            {
                basePath: 'src',
                dest: tempFolder
            },
            item.opts
        );

        let oldTime;
        let newTime;

        if (item.opts.to) {
            item.opts.to = path.join(tempFolder, item.opts.to);
        }

        return t.context
            .processStyle('src/index.css', copyOpts, item.opts.to)
            .then(result => {
                const css = result.css;
                item.assertions.index.forEach(assertion => {
                    t.regex(
                        css,
                        makeRegex(assertion.match, assertion['regex-simple']),
                        assertion.desc
                    );
                });

                oldTime = fs
                    .statSync(
                        path.join(tempFolder, item.assertions['no-modified'])
                    )
                    .mtime.getTime();

                copyOpts.src = ['src', 'external_libs'];
                return t.context.processStyle(
                    'src/component/index.css',
                    copyOpts
                );
            })
            .then(result => {
                const css = result.css;
                item.assertions.component.forEach(assertion => {
                    t.regex(
                        css,
                        makeRegex(assertion.match, assertion['regex-simple']),
                        assertion.desc
                    );
                });

                newTime = fs
                    .statSync(
                        path.join(tempFolder, item.assertions['no-modified'])
                    )
                    .mtime.getTime();

                t.is(
                    oldTime,
                    newTime,
                    `${item.assertions['no-modified']} was not modified.`
                );

                return t.context.processStyle(
                    'external_libs/bootstrap/css/bootstrap.css',
                    copyOpts
                );
            })
            .then(result => {
                const css = result.css;
                item.assertions.external_libs.forEach(assertion => {
                    t.regex(
                        css,
                        makeRegex(assertion.match, assertion['regex-simple']),
                        assertion.desc
                    );
                });

                newTime = fs
                    .statSync(
                        path.join(tempFolder, item.assertions['no-modified'])
                    )
                    .mtime.getTime();

                t.is(
                    oldTime,
                    newTime,
                    `${item.assertions['no-modified']} was not modified.`
                );

                return Promise.all(
                    item.assertions.exists.map(file => {
                        return testFileExists(t, path.join(tempFolder, file));
                    })
                );
            });
    });
});

