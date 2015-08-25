import test from 'tape';
import fs from 'fs';
import postcss from 'postcss';
import copy from '../src/index.js';

function processStyle(filename, userOpts = {}) {
    const opts = Object.assign({
        src: 'tests/src',
        dest: 'tests/dest'
    }, userOpts);

    const file = fs
        .readFileSync('tests/src/' + filename, 'utf8')
        .trim();

    return postcss()
        .use(copy(opts))
        .process(file, {
            from: 'tests/src/' + filename
        })
        .css;
}

function makeRegex(str) {
    return new RegExp(
        str
        .replace(/\//g, '\\\/')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?')
    );
}

const cssIndex = processStyle('index.css');
const cssCheckRelative = processStyle('component/index.css');

test('test-copy-assets', (t) => {
    const start = Date.now();

    setTimeout(() => {
        t.equal(Date.now() - start, 100);
    }, 100);
});
