import test from 'ava';
import randomFolder from './helpers/random-folder';

test.beforeEach(t => {
    t.context.processStyle = require('./helpers/process-style');
});

test('should throw an error if the "dest" option is not setted', t => {
    return t.context
        .processStyle('src/index.css', {
            basePath: 'src'
        })
        .then(() => t.fail())
        .catch(err => {
            t.is(err.message, 'Option `dest` is required in postcss-copy');
        });
});

test('should warn if the filename not belongs to the "basePath" option', t => {
    return t.context
        .processStyle('external_libs/bootstrap/css/bootstrap.css', {
            basePath: 'src',
            dest: randomFolder('dest', t.title)
        })
        .then(result => {
            const warnings = result.warnings();
            t.is(warnings.length, 6);
            warnings.forEach(warning => {
                t.is(warning.text.indexOf('"basePath" not found in '), 0);
            });
        });
});

