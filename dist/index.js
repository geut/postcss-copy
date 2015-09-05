'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _reduceFunctionCall = require('reduce-function-call');

var _reduceFunctionCall2 = _interopRequireDefault(_reduceFunctionCall);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _pathExists = require('path-exists');

var _pathExists2 = _interopRequireDefault(_pathExists);

var tags = ['path', 'name', 'hash', 'ext'];

/**
 * return quote type
 *
 * @param  {String} string quoted (or not) value
 * @return {String} quote if any, or empty string
 */
function getUrlMetaData(string) {
    var quote = '';
    var quotes = ['\"', '\''];
    var trimedString = string.trim();
    quotes.forEach(function (q) {
        if (trimedString.charAt(0) === q && trimedString.charAt(trimedString.length - 1) === q) {
            quote = q;
        }
    });

    var urlMeta = {
        before: string.slice(0, string.indexOf(quote)),
        quote: quote,
        value: quote ? trimedString.substr(1, trimedString.length - 2) : trimedString,
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
    return 'url(' + urlMeta.before + urlMeta.quote + (newPath || urlMeta.value) + urlMeta.quote + urlMeta.after + ')';
}

/**
 * readFile
 *
 * function to try read the src file
 *
 * @param  {string} filepath
 * @return {contents|boolean}
 */
function readFile(filepath) {
    try {
        return _fsExtra2['default'].readFileSync(filepath);
    } catch (e) {
        return false;
    }
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
    var fileMeta = {};
    var parseUrl = _url2['default'].parse(_path2['default'].resolve(dirname, value), true);
    fileMeta.content = readFile(parseUrl.pathname);
    if (!fileMeta.content) {
        return false;
    }
    fileMeta.hash = opts.hashFunction(fileMeta.content);
    fileMeta.fullName = _path2['default'].basename(parseUrl.pathname);
    // name without extension
    fileMeta.name = _path2['default'].basename(parseUrl.pathname, _path2['default'].extname(parseUrl.pathname));
    // extension without the '.'
    fileMeta.ext = _path2['default'].extname(parseUrl.pathname).replace('.', '');
    // the absolute path without the #hash param
    fileMeta.absolutePath = parseUrl.pathname;
    // path between the basePath and the filename
    fileMeta.path = fileMeta.absolutePath.replace(opts.src, '').replace(fileMeta.fullName, '').replace(/^\/+|\/+$/gm, '');
    fileMeta.extra = (parseUrl.search ? parseUrl.search : '') + (parseUrl.hash ? parseUrl.hash : '');
    return fileMeta;
}

/**
 * processCopy
 *
 * @param {Object} result
 * @param {Object} urlMeta url meta data
 * @param {Object} options
 * @param {Object} decl postcss declaration
 * @return {String} new url
 */
function processCopy(result, urlMeta, opts, decl) {
    /**
     * dirname of the read file css
     * @type {String}
     */
    var dirname = decl.source && decl.source.input ? _path2['default'].dirname(decl.source.input.file) : opts.src;

    var fileMeta = getFileMeta(dirname, urlMeta.value, opts);
    if (!fileMeta) {
        result.warn('Can\'t read file \'' + urlMeta.value + '\', ignoring', {
            node: decl
        });
        return createUrl(urlMeta);
    }

    var tpl = opts.template;
    tags.forEach(function (tag) {
        tpl = tpl.replace('[' + tag + ']', fileMeta[tag] ? fileMeta[tag] : opts[tag]);
    });
    var resultAbsolutePath = _path2['default'].resolve(opts.dest, tpl);

    if (!_pathExists2['default'].sync(resultAbsolutePath)) {
        _fsExtra2['default'].outputFileSync(resultAbsolutePath, fileMeta.content);
    }

    var resultUrl = _path2['default'].relative(opts.keepRelativePath ? dirname.replace(opts.src, opts.dest) : opts.dest, resultAbsolutePath) + fileMeta.extra;

    return createUrl(urlMeta, resultUrl);
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
    decl.value = (0, _reduceFunctionCall2['default'])(decl.value, 'url', function (value) {
        var urlMeta = getUrlMetaData(value);

        // ignore absolute urls, hasshes or data uris
        if (urlMeta.value.indexOf('/') === 0 || urlMeta.value.indexOf('data:') === 0 || urlMeta.value.indexOf('#') === 0 || /^[a-z]+:\/\//.test(urlMeta.value)) {
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
 *      template: {String} optional (default 'assets/[hash].[ext]')
 * }
 */
function init() {
    var userOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var opts = {
        template: 'assets/[hash].[ext]',
        keepRelativePath: true,
        hashFunction: function hashFunction(content) {
            return _crypto2['default'].createHash('sha1').update(content).digest('hex').substr(0, 16);
        }
    };
    _Object$assign(opts, userOpts);

    return function (style, result) {
        if (opts.src) {
            opts.src = _path2['default'].resolve(opts.src);
        } else {
            throw new Error('Option `src` is required in postcss-copy');
        }
        if (opts.dest) {
            opts.dest = _path2['default'].resolve(opts.dest);
        } else {
            throw new Error('Option `dest` is required in postcss-copy');
        }

        style.walkDecls(function (decl) {
            if (decl.value && decl.value.indexOf('url(') > -1) {
                processDecl(result, decl, opts);
            }
        });
    };
}

exports['default'] = _postcss2['default'].plugin('postcss-copy', init);
module.exports = exports['default'];
//# sourceMappingURL=index.js.map