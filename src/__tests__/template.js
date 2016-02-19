import test from 'ava';
import randomFolder from './helpers/random-folder';
import processStyle from './helpers/process-style';
import makeRegex from './helpers/make-regex';

test('should rename assets via template function', (t) => {
    return processStyle('src/index.css', {
        src: 'src',
        dest: randomFolder('dest', t.title),
        template(fileMeta) {
            return `custom-path/custom-name-${fileMeta.name}.${fileMeta.ext}`;
        }
    })
    .then(result => {
        const css = result.css;
        t.is(result.warnings().length, 0);
        t.regex(css, makeRegex(
            'custom-path/custom-name-test.jpg?#iefix&v=4.4.0'
        ));
        t.regex(css, makeRegex('custom-path/custom-name-other.jpg'));
    });
});
