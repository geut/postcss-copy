import test from 'ava';
import randomFolder from './helpers/random-folder';
import makeRegex from './helpers/make-regex';
import { sync as exists } from 'path-exists';
import { join } from 'path';

test.beforeEach(t => {
    t.context.processStyle = require('./helpers/process-style');
});

test('should rename files via default template', t => {
    const tempFolder = randomFolder('dest', t.title);
    return t.context.processStyle('src/index.css', {
        basePath: 'src',
        dest: tempFolder
    })
        .then(result => {
            const css = result.css;

            t.is(result.warnings().length, 0);

            t.regex(css, makeRegex('0ed7c955a2951f04.jpg?#iefix&v=4.4.0'));
            t.truthy(exists(join(tempFolder, '0ed7c955a2951f04.jpg')));

            t.regex(css, makeRegex('b6c8f21e92b50900.jpg'));
            t.truthy(exists(join(tempFolder, 'b6c8f21e92b50900.jpg')));
        });
});

test('should rename files via custom template', t => {
    const tempFolder = randomFolder('dest', t.title);
    return t.context.processStyle('src/index.css', {
        basePath: 'src',
        dest: tempFolder,
        template: '[path]/[name]-[hash].[ext][query]'
    })
        .then(result => {
            const css = result.css;

            t.is(result.warnings().length, 0);

            t.regex(css, makeRegex(
                'images/test-0ed7c955a2951f04.jpg?#iefix&v=4.4.0'
            ));
            t.truthy(
                exists(join(tempFolder, 'images/test-0ed7c955a2951f04.jpg'))
            );

            t.regex(css, makeRegex('images/other-b6c8f21e92b50900.jpg'));
            t.truthy(
                exists(join(tempFolder, 'images/other-b6c8f21e92b50900.jpg'))
            );
        });
});

test('should rename files via template function', t => {
    const tempFolder = randomFolder('dest', t.title);
    return t.context.processStyle('src/index.css', {
        basePath: 'src',
        dest: tempFolder,
        template(fileMeta) {
            return `custom-path/custom-name-${fileMeta.name}.` +
            `${fileMeta.ext}${fileMeta.query}`;
        }
    })
        .then(result => {
            const css = result.css;

            t.is(result.warnings().length, 0);

            t.regex(css, makeRegex(
                'custom-path/custom-name-test.jpg?#iefix&v=4.4.0'
            ));
            t.truthy(
                exists(join(tempFolder, 'custom-path/custom-name-test.jpg'))
            );

            t.regex(css, makeRegex('custom-path/custom-name-other.jpg'));
            t.truthy(
                exists(join(tempFolder, 'custom-path/custom-name-other.jpg'))
            );
        });
});
