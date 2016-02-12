import postcss from 'postcss';
import path from 'path';
import reduceFunctionCall from 'reduce-function-call';
import fs from 'fs';
import url from 'url';
import crypto from 'crypto';
import pathExists from 'path-exists';
import mkdirp from 'mkdirp';
import escapeStringRegexp from 'escape-string-regexp';
import minimatch from 'minimatch';

const tags = [
    'path',
    'name',
    'hash',
    'ext'
];

/**
 * return quote type
 *
 * @param  {String} string quoted (or not) value
 * @return {String} quote if any, or empty string
 */
function getUrlMetaData(string) {
    let quote = '';
    const quotes = ['\"', '\''];
    const trimedString = string.trim();
    quotes.forEach((q) => {
        if (
            trimedString.charAt(0) === q &&
            trimedString.charAt(trimedString.length - 1) === q
        ) {
            quote = q;
        }
    });

    const urlMeta = {
        before: string.slice(0, string.indexOf(quote)),
        quote: quote,
        value: quote ?
            trimedString.substr(1, trimedString.length - 2)
            : trimedString,
        after: string.slice(string.lastIndexOf(quote) + 1)
    };
    return urlMeta;
}

/**
 * Create an css url() from a path and a quote style
 *
 * @param {String} urlMeta url meta data
 * @param {String} newPath url path
 * @return {String} new url()
 */
function createUrl(urlMeta, newPath) {
    return urlMeta.before +
        urlMeta.quote +
        (newPath || urlMeta.value) +
        urlMeta.quote +
        urlMeta.after;
}

/**
 * writeFile
 *
 * function to write the asset file in dest
 *
 * @param  {object} fileMeta
 * @return {contents|boolean}
 */
function writeFile(fileMeta) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileMeta.resultAbsolutePath, fileMeta.contents, (err) => {
            if (err) {
                reject(`Can't write in ${fileMeta.resultAbsolutePath}`);
            } else {
                resolve(fileMeta);
            }
        });
    });
}

/**
 * [fileExists description]
 * @param  {[type]} filepath [description]
 * @return {[type]}          [description]
 */
function copyFile(fileMeta, transform) {
    return pathExists(fileMeta.resultAbsolutePath)
        .then((exists) => {
            fileMeta.exists = exists;
            if (exists) {
                return fileMeta;
            }

            mkdirp.sync(path.dirname(fileMeta.resultAbsolutePath));
            return transform(fileMeta);
        })
        .then((fmTransform) => {
            if (fmTransform.exists) {
                return fmTransform;
            }
            return writeFile(fmTransform);
        });
}


/**
 * getFileMeta
 *
 * Helper function to ignore files
 *
 * @param  {string} filename
 * @param  {string} extra
 * @param  {Object} options
 * @return {boolean} meta information from the resource
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
 * getFileMeta
 *
 * Helper function that reads the file ang get some helpful information
 * to the copy process.
 *
 * @param  {string} dirname
 * @param  {string} value
 * @param  {Object} options
 * @return {Object} meta information from the resource
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

    return new Promise((resolve, reject) => {
        // ignore option
        fs.readFile(pathName, (err, contents) => {
            if (err) {
                reject(`Warning in postcss-copy:
                    Can't read the file in ${pathName}`);
            } else if (!(fileMeta.src)) {
                reject(`Warning in postcss-copy:
                    "src" not found in ${pathName}`);
            } else {
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

                fileMeta.path = fileMeta
                    .absolutePath
                    .replace(fileMeta.src, '')
                    .replace(fileMeta.fullName, '')
                    .replace(/^\/+|\/+$/gm, '');

                fileMeta.extra = extra;

                resolve(fileMeta);
            }
        });
    });
}

/**
 * update the url result
 * @param {Object} decl postcss declaration
 * @param {string} old value
 * @param {Object} urlMeta url meta data
 * @param  {String} new url
 * @return {Object} return decl postcss declaration with url updated
 */
function updateUrl(decl, oldValue, urlMeta, resultUrl) {
    const expression = new RegExp(
        '(\\()(' + escapeStringRegexp(oldValue) + ')(\\))', 'g'
    );
    decl.value = decl.value.replace(
        expression,
        '$1' + createUrl(urlMeta, resultUrl) + '$3'
    );
    return decl.value;
}

/**
 * processCopy
 *
 * @param {Object} result
 * @param {Object} urlMeta url meta data
 * @param {Object} options
 * @param {Object} decl postcss declaration
 * @param {string} old value
 * @return {String} new url
 */
function processCopy(result, urlMeta, opts, decl, oldValue) {
    // ignore absolute urls, hasshes, data uris or by **ignore option**
    if (urlMeta.value.indexOf('!') === 0) {
        return updateUrl(
            decl,
            oldValue,
            urlMeta,
            urlMeta.value.slice(1, urlMeta.value.length)
        );
    }
    if (urlMeta.value.indexOf('/') === 0 ||
        urlMeta.value.indexOf('data:') === 0 ||
        urlMeta.value.indexOf('#') === 0 ||
        /^[a-z]+:\/\//.test(urlMeta.value)
    ) {
        return updateUrl(decl, oldValue, urlMeta);
    }

    /**
     * dirname of the read file css
     * @type {String}
     */
    const dirname = opts.inputPath(decl);

    return getFileMeta(dirname, urlMeta.value, opts)
        .then((fileMeta) => {
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
        .then((fileMeta) => {
            const resultUrl = path.relative(
                opts.keepRelativePath
                    ? dirname.replace(fileMeta.src, opts.dest)
                    : opts.dest,
                fileMeta.resultAbsolutePath
            ) + fileMeta.extra;
            return updateUrl(decl, oldValue, urlMeta, resultUrl);
        })
        .catch((err) => {
            decl.warn(result, err);
            return updateUrl(decl, oldValue, urlMeta);
        });
}

/**
 * Processes one declaration
 *
 * @param {Object} result
 * @param {Object} decl  postcss declaration
 * @param {Object} options plugin options
 * @return {void}
 */
function processDecl(result, decl, opts) {
    return new Promise((resolve, reject) => {
        const promises = [];

        reduceFunctionCall(decl.value, 'url', (value) => {
            const urlMeta = getUrlMetaData(value);

            promises.push(processCopy(result, urlMeta, opts, decl, value));
        });

        Promise.all(promises).then(resolve, reject);
    });
}

/**
 * Initialize the postcss-copy plugin
 * @param  {Object} plugin options
 * @return {void}
 *
 * userOpts = {
 * 		src: {String} optional
 * 		dest: {String} optional
 *      template: {String} optional (default 'assets/[hash].[ext]')
 * }
 */
function init(userOpts = {}) {
    const opts = Object.assign({
        template: 'assets/[hash].[ext]',
        keepRelativePath: true,
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

        if (!(opts.keepRelativePath)) {
            if (result.opts &&
                result.opts.to &&
                (result.opts.to !== result.opts.from) ) {
                opts.to = path.dirname(path.resolve(result.opts.to));
            } else {
                opts.to = opts.dest;
            }
        }
        if (typeof opts.ignore === 'string') {
            opts.ignore = [opts.ignore];
        }

        return new Promise((resolve, reject) => {
            const promises = [];
            style.walkDecls(decl => {
                if (decl.value && decl.value.indexOf('url(') > -1) {
                    promises.push(processDecl(result, decl, opts));
                }
            });
            Promise.all(promises).then(resolve, reject);
        });
    };
}

export default postcss.plugin('postcss-copy', init);
