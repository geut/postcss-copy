import test from 'ava';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';
import makeRegex from './helpers/make-regex';

test('should keep working if the ignore option is invalid', t => {
    return processStyle('src/ignore.css', {
        src: 'src',
        dest: randomFolder('dest', t.title),
        template: 'invalid-ignore-option/[path]/[name].[ext]',
        ignore: 4
    })
    .then(result => {
        const css = result.css;
        t.regex(css, makeRegex('images/test.jpg?#iefix&v=4.4.0'));
        t.regex(css, makeRegex('invalid-ignore-option/images/other.jpg'));
        t.regex(css, makeRegex('invalid-ignore-option/images/noignore.jpg'));
    });
});

test('should ignore files with string expression', t => {
    return processStyle('src/ignore.css', {
        src: 'src',
        dest: randomFolder('dest', t.title),
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
        dest: randomFolder('dest', t.title),
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
        dest: randomFolder('dest', t.title),
        template: 'ignore-path-func/[path]/[name].[ext]',
        ignore(fileMeta) {
            return fileMeta.filename === 'images/other.jpg';
        }
    })
    .then((result) => {
        const css = result.css;
        t.regex(css, makeRegex('images/test.jpg?#iefix&v=4.4.0'));
        t.regex(css, makeRegex('images/other.jpg'));
        t.regex(css, makeRegex('ignore-path-func/images/noignore.jpg'));
    });
});
