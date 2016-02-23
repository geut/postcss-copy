import postcss from 'postcss';
import path from 'path';
import valueParser from 'postcss-value-parser';
import url from 'url';
import crypto from 'crypto';
import pathExists from 'path-exists';
import minimatch from 'minimatch';
import { readFile, writeFile } from './lib/fs';

const tags = [
    'path',
    'name',
    'hash',
    'ext'
];

/**
 * copy low level process
 * @param  {object} fileMeta information about the asset file
 * @param  {function} transform custom function to transform the buffer content
 * @return {Promise} resolve => fileMeta | reject => error message
 */
function copyFile(fileMeta, transform) {
    let fileAbsolutePath = fileMeta.resultAbsolutePath.split('?')[0];
    return pathExists(fileAbsolutePath)
        .then(exists => {
            fileMeta.exists = exists;
            if (exists) {
                return fileMeta;
            }

            return transform(fileMeta);
        })
        .then(fmTransform => {
            if (fmTransform.exists) {
                return fmTransform;
            }

            return writeFile(
                fileAbsolutePath,
                fmTransform.contents
            )
            .then(() => {
                return fmTransform;
            });
        });
}

/**
 * Helper function to ignore files
 *
 * @param  {string} filename
 * @param  {string} extra
 * @param  {Object} opts plugin options
 * @return {boolean}
 */
function ignore(filename, extra, opts) {
    // ignore option
    if (typeof opts.ignore === 'function') {
        return opts.ignore(filename, extra);
    } else if (opts.ignore instanceof Array) {
        const list = opts.ignore;
        const len = list.length;
        let toIgnore = false;
        for (let i = 0; i < len; i++) {
            if (minimatch(filename + extra, list[i])) {
                toIgnore = true;
                break;
            }
        }
        return toIgnore;
    }


    return false;
}

/**
 * Helper function that reads the file ang get some helpful information
 * to the copy process.
 *
 * @param  {string} dirname path of the read file css
 * @param  {string} value url
 * @param  {Object} opts plugin options
 * @return {Promise} resolve => fileMeta | reject => error message
 */
function getFileMeta(dirname, value, opts) {
    let pathName = path.resolve(dirname, value);
    const parseUrl = url.parse(pathName, true);
    const extra = (parseUrl.search ? parseUrl.search : '') +
        (parseUrl.hash ? parseUrl.hash : '');
    pathName = pathName.replace(extra, '');

    const filename = value.replace(extra, '');

    if (ignore(filename, extra, opts)) {
        return Promise.reject(`${filename} ignored.`);
    }

    const fileMeta = {};

    // path between the basePath and the filename
    let i = 0;
    while (!fileMeta.src && i < opts.src.length) {
        if (pathName.indexOf(opts.src[i]) !== -1) {
            fileMeta.src = opts.src[i];
        }
        i++;
    }

    if (!fileMeta.src) {
        return Promise.reject(`"src" not found in ${pathName}`);
    }

    return readFile(pathName).then(contents => {
        fileMeta.contents = contents;
        fileMeta.hash = opts.hashFunction(fileMeta.contents);
        fileMeta.fullName = path.basename(pathName);
        fileMeta.ext = path.extname(pathName);

        // name without extension
        fileMeta.name = path.basename(
            pathName,
            fileMeta.ext
        );

        // extension without the '.'
        fileMeta.ext = fileMeta.ext.replace('.', '');

        // the absolute path without the #hash param
        fileMeta.absolutePath = pathName;

        fileMeta.path = path.relative(
            fileMeta.src,
            path.dirname(pathName)
        );

        fileMeta.extra = extra;

        return fileMeta;
    });
}


/**
 * process to copy an asset based on the css file, destination
 * and the url value
 *
 * @param {Object} result
 * @param {Object} decl postcss declaration
 * @param {Object} node postcss-value-parser
 * @param {Object} opts plugin options
 * @return {Promise}
 */
function processCopy(result, decl, node, opts) {
    // ignore absolute urls, hasshes, data uris or by **ignore option**
    if (node.value.indexOf('!') === 0) {
        node.value = node.value.slice(1);
        return Promise.resolve();
    }
    if (node.value.indexOf('/') === 0 ||
        node.value.indexOf('data:') === 0 ||
        node.value.indexOf('#') === 0 ||
        /^[a-z]+:\/\//.test(node.value)
    ) {
        return Promise.resolve();
    }

    /**
     * dirname of the read file css
     * @type {String}
     */
    const dirname = opts.inputPath(decl);

    return getFileMeta(dirname, node.value, opts)
        .then(fileMeta => {
            let tpl = opts.template;
            if (typeof tpl === 'function') {
                tpl = tpl(fileMeta);
            } else {
                tags.forEach((tag) => {
                    tpl = tpl.replace(
                        '[' + tag + ']',
                        fileMeta[tag] ? fileMeta[tag] : opts[tag]
                    );
                });
            }

            fileMeta.resultAbsolutePath = path.resolve(opts.dest, tpl);

            return copyFile(fileMeta, opts.transform);
        })
        .then(fileMeta => {
            const relativePath = opts.relativePath(
                dirname,
                fileMeta,
                result,
                opts
            );

            node.value = path.relative(
                relativePath,
                fileMeta.resultAbsolutePath
            ).split('\\').join('/') + fileMeta.extra;
        })
        .catch(err => {
            decl.warn(result, err);
        });
}

/**
 * Processes each declaration using postcss-value-parser
 *
 * @param {Object} result
 * @param {Object} decl postcss declaration
 * @param {Object} opts plugin options
 * @return {Promise}
 */
function processDecl(result, decl, opts) {
    const promises = [];

    decl.value = valueParser(decl.value).walk(node => {
        if (
            node.type !== 'function' ||
            node.value !== 'url' ||
            node.nodes.length === 0
        ) {
            return;
        }

        promises.push(processCopy(result, decl, node.nodes[0], opts));
    });

    return Promise.all(promises).then(() => decl);
}

/**
 * Initialize the postcss-copy plugin
 * @param  {Object} plugin options
 * @return {plugin}
 */
function init(userOpts = {}) {
    const opts = Object.assign({
        template: 'assets/[hash].[ext]',
        relativePath(dirname, fileMeta, result, options) {
            return path.join(
                options.dest,
                path.relative(fileMeta.src, dirname)
            );
        },
        hashFunction(contents) {
            return crypto.createHash('sha1')
                .update(contents)
                .digest('hex')
                .substr(0, 16);
        },
        transform(fileMeta) {
            return fileMeta;
        },
        inputPath(decl) {
            return path.dirname(decl.source.input.file);
        },
        ignore: []
    }, userOpts);

    return (style, result) => {
        if (opts.src) {
            if (typeof opts.src === 'string') {
                opts.src = [path.resolve(opts.src)];
            } else {
                opts.src = opts.src.map((elem) => path.resolve(elem));
            }
        } else {
            throw new Error('Option `src` is required in postcss-copy');
        }
        if (opts.dest) {
            opts.dest = path.resolve(opts.dest);
        } else {
            throw new Error('Option `dest` is required in postcss-copy');
        }

        if (typeof opts.ignore === 'string') {
            opts.ignore = [opts.ignore];
        }

        const promises = [];
        style.walkDecls(decl => {
            if (decl.value && decl.value.indexOf('url(') > -1) {
                promises.push(processDecl(result, decl, opts));
            }
        });
        return Promise.all(promises).then(decls =>
            decls.forEach(decl => {
                decl.value = String(decl.value);
            })
        );
    };
}

export default postcss.plugin('postcss-copy', init);
