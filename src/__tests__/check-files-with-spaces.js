import test from 'ava';
import randomFolder from './helpers/random-folder';
import makeRegex from './helpers/make-regex';
import path from 'path';
import { testFileExists, checkForWarnings } from './helpers';

test.beforeEach(t => {
    t.context.processStyle = require('./helpers/process-style');
});

test('should copy files with spaces', t => {
    const tempFolder = randomFolder('dest', t.title);
    const expected = 'images/file space.jpg';

    return t.context.processStyle('src/check-files-with-spaces.css', {
        basePath: 'src',
        dest: tempFolder,
        template: '[path]/[name].[ext]'
    })
        .then(result => {
            checkForWarnings(t, result);
            const css = result.css;
            t.regex(css, makeRegex(expected));
            return testFileExists(t, path.join(tempFolder, expected));
        });
});
