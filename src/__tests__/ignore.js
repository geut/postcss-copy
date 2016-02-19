import test from 'ava';
import processStyle from './helpers/process-style.js';
import makeRegex from './helpers/make-regex.js';

test('should ignore files with string expression', t => {
    return processStyle('src/ignore.css', {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-array/[path]/[name].[ext]',
        ignore: 'images/other.+(jpg|png)'
    })
    .then(result => {
        const css = result.css;
        t.regex(css, makeRegex('images/test.jpg?#iefix&v=4.4.0'));
        t.regex(css, makeRegex('images/other.jpg'));
        t.regex(css, makeRegex('ignore-path-array/images/noignore.jpg'));
    });
});

test('should ignore files with array of paths', t => {
    return processStyle('src/ignore.css', {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-array/[path]/[name].[ext]',
        ignore: ['images/other.jpg']
    })
    .then(result => {
        const css = result.css;
        t.regex(css, makeRegex('images/test.jpg?#iefix&v=4.4.0'));
        t.regex(css, makeRegex('images/other.jpg'));
        t.regex(css, makeRegex('ignore-path-array/images/noignore.jpg'));
    });
});

test('should ignore files with custom function', t => {
    return processStyle('src/ignore.css', {
        src: 'src',
        dest: 'dest',
        template: 'ignore-path-func/[path]/[name].[ext]',
        ignore(filename) {
            return filename === 'images/other.jpg';
        }
    })
    .then((result) => {
        const css = result.css;
        t.regex(css, makeRegex('images/test.jpg?#iefix&v=4.4.0'));
        t.regex(css, makeRegex('images/other.jpg'));
        t.regex(css, makeRegex('ignore-path-func/images/noignore.jpg'));
    });
});
