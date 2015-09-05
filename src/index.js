import postcss from 'postcss';
import path from 'path';
import reduceFunctionCall from 'reduce-function-call';
import fs from 'fs-extra';
import url from 'url';
import crypto from 'crypto';
import pathExists from 'path-exists';

const tags = [
    'assetsPath',
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
        value: quote
            ? trimedString.substr(1, trimedString.length - 2)
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
    return 'url(' +
        urlMeta.before +
        urlMeta.quote +
        (newPath || urlMeta.value) +
        urlMeta.quote +
        urlMeta.after +
        ')';
}

function readFile(filepath) {
    try {
        return fs.readFileSync(filepath);
    } catch (e) {
        return false;
    }
}

function getFileMeta(dirname, value, opts) {
    const fileMeta = {};
    const parseUrl = url.parse(path.resolve(dirname, value), true);
    fileMeta.content = readFile(parseUrl.pathname);
    if (!(fileMeta.content)) {
        return false;
    }
    fileMeta.hash = opts.hashFunction(fileMeta.content);
    fileMeta.fullName = path.basename(parseUrl.pathname);
    // name without extension
    fileMeta.name = path.basename(
        parseUrl.pathname,
        path.extname(parseUrl.pathname)
    );
    // extension without the '.'
    fileMeta.ext = path.extname(parseUrl.pathname).replace('.', '');
    // the absolute path without the #hash param
    fileMeta.absolutePath = parseUrl.pathname;
    // path between the basePath and the filename
    fileMeta.path = fileMeta
        .absolutePath
        .replace(opts.src, '')
        .replace(fileMeta.fullName, '')
        .replace(/^\/+|\/+$/gm, '');
    fileMeta.extra = (parseUrl.search ? parseUrl.search : '') +
        (parseUrl.hash ? parseUrl.hash : '');
    return fileMeta;
}

/**
 * Copy images read from url() to an specific assets destination
 * (`assetsPath`) and fix url() according to that path.
 * You can rename the assets by a hash or keep the real pathname.
 *
 * @param {String} dirname to dirname
 * @param {String} urlMeta url meta data
 * @param {String} to destination
 * @param {Object} options plugin options
 * @return {String} new url
 */
function processCopy(result, urlMeta, opts, decl) {
    /**
     * dirname of the read file css
     * @type {String}
     */
    const dirname = decl.source && decl.source.input
        ? path.dirname(decl.source.input.file)
        : opts.src;

    const fileMeta = getFileMeta(dirname, urlMeta.value, opts);
    if (!(fileMeta)) {
        result.warn('Can\'t read file \'' + urlMeta.value + '\', ignoring', {
            node: decl
        });
        return createUrl(urlMeta);
    }

    let tpl = opts.template;
    tags.forEach((tag) => {
        tpl = tpl.replace(
            '[' + tag + ']',
            fileMeta[tag] ? fileMeta[tag] : opts[tag]
        );
    });
    const resultAbsolutePath = path.resolve(opts.dest, tpl);

    if (!(pathExists.sync(resultAbsolutePath))) {
        fs.outputFileSync(resultAbsolutePath, fileMeta.content);
    }

    const resultUrl = path.relative(
        opts.keepRelativePath
            ? dirname.replace(opts.src, opts.dest)
            : opts.dest,
        resultAbsolutePath
    ) + fileMeta.extra;

    return createUrl(urlMeta, resultUrl);
}

/**
 * Processes one declaration
 *
 * @param {Object} decl postcss declaration
 * @param {String|Function} mode plugin mode
 * @param {Object} options plugin options
 * @return {void}
 */
function processDecl(result, decl, opts) {
    decl.value = reduceFunctionCall(decl.value, 'url', (value) => {
        const urlMeta = getUrlMetaData(value);

        // ignore absolute urls, hasshes or data uris
        if (urlMeta.value.indexOf('/') === 0 ||
            urlMeta.value.indexOf('data:') === 0 ||
            urlMeta.value.indexOf('#') === 0 ||
            /^[a-z]+:\/\//.test(urlMeta.value)
        ) {
            return createUrl(urlMeta);
        }

        return processCopy(result, urlMeta, opts, decl);
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
 *      template: {String} optional (default '[assetsPath]/[hash].[ext]')
 * }
 */
function init(userOpts = {}) {
    const opts = {
        assetsPath: 'assets',
        template: '[assetsPath]/[hash].[ext]',
        keepRelativePath: true,
        hashFunction(content) {
            return crypto.createHash('sha1')
                .update(content)
                .digest('hex')
                .substr(0, 16);
        }
    };
    Object.assign(opts, userOpts);

    return (style, result) => {
        if (opts.src) {
            opts.src = path.resolve(opts.src);
        } else {
            opts.src = process.cwd();
        }
        if (opts.dest) {
            opts.dest = path.resolve(opts.dest);
        } else {
            throw new Error('Option `dest` is required in postcss-copy');
        }

        style.walkDecls((decl) => {
            if (decl.value && decl.value.indexOf('url(') > -1) {
                processDecl(result, decl, opts);
            }
        });
    };
}

export default postcss.plugin('postcss-copy', init);
