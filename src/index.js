import postcss from 'postcss';
import path from 'path';
import valueParser from 'postcss-value-parser';
import url from 'url';
import crypto from 'crypto';
import micromatch from 'micromatch';
import copy from './lib/copy';

const tags = [
    'path',
    'name',
    'hash',
    'ext',
    'query',
    'qparams',
    'qhash'
];

/**
 * Helper function to ignore files
 *
 * @param  {string} filename
 * @param  {string} extra
 * @param  {Object} opts plugin options
 * @return {boolean}
 */
function ignore(fileMeta, opts) {
    if (typeof opts.ignore === 'function') {
        return opts.ignore(fileMeta, opts);
    }

    if (typeof opts.ignore === 'string' || Array.isArray(opts.ignore)) {
        return micromatch.any(fileMeta.sourceValue, opts.ignore);
    }

    return false;
}

/**
 * Helper function that reads the file ang get some helpful information
 * to the copy process.
 *
 * @param  {string} dirname path of the read file css
 * @param  {string} sourceInputFile path to the source input file css
 * @param  {string} value url
 * @param  {Object} opts plugin options
 * @return {Promise} resolve => fileMeta | reject => error message
 */
function getFileMeta(dirname, sourceInputFile, value, opts) {
    const parsedUrl = url.parse(value, true);
    const filename = parsedUrl.pathname;
    const pathname = path.resolve(dirname, filename);
    const params = parsedUrl.search || '';
    const hash = parsedUrl.hash || '';

    // path between the basePath and the filename
    const src = opts.src.filter(item => pathname.indexOf(item) !== -1)[0];
    if (!src) {
        throw Error(`"src" not found in ${pathname}`);
    }

    const ext = path.extname(pathname);
    const fileMeta = {
        sourceInputFile,
        sourceValue: value,
        filename,
        // the absolute path without the #hash param and ?query
        absolutePath: pathname,
        fullName: path.basename(pathname),
        path: path.relative(src, path.dirname(pathname)),
        // name without extension
        name: path.basename(pathname, ext),
        // extension without the '.'
        ext: ext.slice(1),
        query: params + hash,
        qparams: params.length > 0 ? params.slice(1) : '',
        qhash: hash.length > 0 ? hash.slice(1) : '',
        src
    };

    return fileMeta;
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
function processUrl(result, decl, node, opts) {
    // ignore from the css file by `!`
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

    let fileMeta = getFileMeta(
        dirname,
        decl.source.input.file,
        node.value,
        opts
    );

    // ignore from the fileMeta config
    if (ignore(fileMeta, opts)) {
        return Promise.resolve();
    }

    return copy(
        fileMeta.absolutePath,
        () => {
            return fileMeta.resultAbsolutePath;
        },
        (contents, isModified) => {
            fileMeta.contents = contents;
            fileMeta.hash = opts.hashFunction(contents);
            let tpl = opts.template;
            if (typeof tpl === 'function') {
                tpl = tpl(fileMeta);
            } else {
                tags.forEach(tag => {
                    tpl = tpl.replace(
                        '[' + tag + ']',
                        fileMeta[tag] || opts[tag] || ''
                    );
                });
            }

            const resultUrl = url.parse(tpl);
            fileMeta.resultAbsolutePath = path.resolve(
                opts.dest,
                resultUrl.pathname
            );
            fileMeta.extra = (resultUrl.search || '') + (resultUrl.hash || '');

            return Promise.resolve(
                isModified ? opts.transform(fileMeta) : fileMeta
            )
            .then(fileMetaTransformed => fileMetaTransformed.contents);
        }
    )
    .then(() => {
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

        const promise = Promise.resolve().then(() => {
            return processUrl(result, decl, node.nodes[0], opts);
        })
        .catch(err => {
            decl.warn(result, err.message);
        });

        promises.push(promise);
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
        template: '[hash].[ext][query]',
        relativePath(dirname, fileMeta, result, options) {
            return path.join(
                result.opts.to ? path.dirname(result.opts.to) : options.dest,
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
