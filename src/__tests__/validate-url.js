import test from 'ava';
import path from 'path';
import processStyle from './helpers/process-style.js';
import makeRegex from './helpers/make-regex.js';

test('should correctly parse url', t => {
    return processStyle('src/correct-parse-url.css', {
        src: 'src',
        dest: 'dest',
        template: '[path]/[name].[ext]'
    })
    .then(result => {
        const css = result.css;
        t.ok(css.match(makeRegex('fonts/MaterialIcons-Regular.woff')));
        t.ok(css.match(makeRegex('fonts/MaterialIcons-Regular.woff2')));
    });
});

test('should ignore if the url() is not valid', t => {
    return processStyle('src/invalid.css', {
        src: 'src',
        dest: 'dest'
    })
    .then(result => {
        const css = result.css;
        t.is(result.warnings().length, 0);
        t.ok(css.match(makeRegex('assets/b6c8f21e92b50900.jpg')));
        t.ok(css.match(makeRegex('data:image/gif;base64,R0lGOD')));
    });
});

test('should ignore if the asset is not found in the src path', t => {
    return processStyle('src/not-found.css', {
        src: 'src',
        dest: 'dest'
    })
    .then(result => {
        const css = result.css;
        const warnings = result.warnings();
        t.is(warnings.length, 1);
        t.is(warnings[0].text, `Can't read the file in ${
            path.resolve('src/images/image-not-found.jpg')
        }`);
        t.ok(css.match(makeRegex('assets/b6c8f21e92b50900.jpg')));
        t.ok(css.match(makeRegex('images/image-not-found.jpg')));
    });
});
