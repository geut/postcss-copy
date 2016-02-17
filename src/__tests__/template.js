import test from 'ava';
import processStyle from './helpers/process-style.js';
import makeRegex from './helpers/make-regex.js';

test('should rename assets via template function', (t) => {
    return processStyle('src/index.css', {
        src: 'src',
        dest: 'dest',
        template(fileMeta) {
            return `custom-path/custom-name-${fileMeta.name}.${fileMeta.ext}`;
        }
    })
    .then(result => {
        const css = result.css;
        t.is(result.warnings().length, 0);
        t.ok(css.match(makeRegex(
            'custom-path/custom-name-test.jpg?#iefix&v=4.4.0'
        )));
        t.ok(css.match(makeRegex('custom-path/custom-name-other.jpg')));
    });
});
