import test from 'ava';
import { defineCSSDestPath } from '../lib/tools-path';
import path from 'path';

test(`defineCSSDestPath should return the 'opts.dest' dirname
if ('to' === undefined) && preservePath === false`, t => {
        const result = defineCSSDestPath(
            'src',
            'src',
            {
                opts: {
                    from: 'src/index.css'
                }
            },
            {
                dest: 'dest'
            }
        );

        t.is(result, 'dest');
    });

test(`defineCSSDestPath should return the 'opts.dest'
if (to === from) && preservePath == false`, t => {
        const result = defineCSSDestPath(
            'src',
            'src',
            {
                opts: {
                    from: 'src/index.css',
                    to: 'src/index.css'
                }
            },
            {
                dest: 'dest'
            }
        );

        t.is(result, 'dest');
    });


test(`defineCSSDestPath should return the 'to'
if (to !== undefined && to !== from) && preservePath == false`, t => {
        const result = defineCSSDestPath(
            'src',
            'src',
            {
                opts: {
                    from: 'src/index.css',
                    to: 'output/index.css'
                }
            },
            {
                dest: 'dest'
            }
        );

        t.is(result, 'output');
    });

test(`defineCSSDestPath should preserve the structure directories
if preservePath == true && !postcss-import`, t => {
        const result = defineCSSDestPath(
            path.resolve('src'),
            'src',
            {
                opts: {
                    from: 'src/index.css'
                }
            },
            {
                preservePath: true,
                dest: 'dest'
            }
        );

        t.is(result, 'dest');
    });

test(`defineCSSDestPath should preserve the structure directories
if preservePath == true && postcss-import`, t => {
        const result = defineCSSDestPath(
            'different-path/index.css',
            'src',
            {
                opts: {
                    from: 'src/index.css'
                }
            },
            {
                basePath: [path.resolve('src')],
                preservePath: true,
                dest: 'dest'
            }
        );

        t.is(result, 'dest');
    });
