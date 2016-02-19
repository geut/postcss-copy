import test from 'ava';
import processStyle from './helpers/process-style.js';

test('should throw an error if the "src" option is not setted', t => {
    return processStyle('src/index.css', {
        dest: 'dest'
    })
    .then(() => t.fail())
    .catch(err => {
        t.is(err.message, 'Option `src` is required in postcss-copy');
    });
});

test('should throw an error if the "dest" option is not setted', t => {
    return processStyle('src/index.css', {
        src: 'src'
    })
    .then(() => t.fail())
    .catch(err => {
        t.is(err.message, 'Option `dest` is required in postcss-copy');
    });
});

test('should warn if the filename not belongs to the "src" option', t => {
    return processStyle('external_libs/bootstrap/css/bootstrap.css', {
        src: 'src',
        dest: 'dest'
    })
    .then(result => {
        const warnings = result.warnings();
        t.is(warnings.length, 6);
        warnings.forEach(warning => {
            t.is(warning.text.indexOf('"src" not found in '), 0);
        });
    });
});