import postcss from 'postcss';
import path from 'path';
import valueParser from 'postcss-value-parser';
import url from 'url';
import crypto from 'crypto';
import micromatch from 'micromatch';
import copy from './lib/copy';

const tags = ['path', 'name', 'hash', 'ext', 'query', 'qparams', 'qhash'];

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
 * Quick function to find a basePath where the
 * the asset file belongs.
 *
 * @param paths
 * @param pathname
 * @returns {string|boolean}
 */
function findBasePath(paths, pathname) {
    for (const item of paths) {
        if (pathname.indexOf(item) === 0) {
            return item;
        }
    }

    return false;
}

/**
 * Function to define the dest path of your CSS file
 *
 * @param dirname
 * @param fileMeta
 * @param result
 * @param opts
 * @returns {string}
 */
function defineCSSDestPath(dirname, fileMeta, result, opts) {
    if (!result.opts.to) {
        return opts.dest;
    }

    const from = path.resolve(result.opts.from);
    const to = path.resolve(result.opts.to);

    if (to === from || opts.preservePath && dirname === path.dirname(from)) {
        /**
         * if to === results.opts.from we can't use it as a valid dest path
         * e.g: gulp-postcss comes with this problem
         *
         * if dirname === path.dirname(result.opts.from) with this
         * condition we can check if the postcss-copy runs after postcss-import
         * and if preservePath is activated preserve the structure of
         * the assets directory
         */
        return path.join(opts.dest, path.relative(fileMeta.basePath, dirname));
    }

    return path.dirname(to);
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
    const basePath = findBasePath(opts.basePath, pathname);
    if (!basePath) {
        throw Error(`"basePath" not found in ${pathname}`);
    }

    const ext = path.extname(pathname);
    const fileMeta = {
        sourceInputFile,
        sourceValue: value,
        filename,
        // the absolute path without the #hash param and ?query
        absolutePath: pathname,
        fullName: path.basename(pathname),
        path: path.relative(basePath, path.dirname(pathname)),
        // name without extension
        name: path.basename(pathname, ext),
        // extension without the '.'
        ext: ext.slice(1),
        query: params + hash,
        qparams: params.length > 0 ? params.slice(1) : '',
        qhash: hash.length > 0 ? hash.slice(1) : '',
        basePath
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

    if (
        node.value.indexOf('/') === 0 ||
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
    const dirname = path.dirname(decl.source.input.file);

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
        () => fileMeta.resultAbsolutePath,
        (contents, isModified) => {
            fileMeta.contents = contents;

            return Promise.resolve(
                isModified ? opts.transform(fileMeta) : fileMeta
            )
                .then(fileMetaTransformed => {
                    fileMetaTransformed.hash = opts.hashFunction(
                        fileMetaTransformed.contents
                    );
                    let tpl = opts.template;
                    if (typeof tpl === 'function') {
                        tpl = tpl(fileMetaTransformed);
                    } else {
                        tags.forEach(tag => {
                            tpl = tpl.replace(
                                '[' + tag + ']',
                                fileMetaTransformed[tag] || opts[tag] || ''
                            );
                        });
                    }

                    const resultUrl = url.parse(tpl);
                    fileMetaTransformed.resultAbsolutePath = path.resolve(
                        opts.dest,
                        resultUrl.pathname
                    );
                    fileMetaTransformed.extra = (resultUrl.search || '') +
                        (resultUrl.hash || '');

                    return fileMetaTransformed;
                })
                .then(fileMetaTransformed => fileMetaTransformed.contents);
        }
    ).then(() => {
        const destPath = defineCSSDestPath(
            dirname,
            fileMeta,
            result,
            opts
        );

        node.value = path
            .relative(destPath, fileMeta.resultAbsolutePath)
            .split('\\')
            .join('/') + fileMeta.extra;
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

        const promise = Promise.resolve()
            .then(() => processUrl(result, decl, node.nodes[0], opts))
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
    const opts = Object.assign(
        {
            template: '[hash].[ext][query]',
            preservePath: false,
            hashFunction(contents) {
                return crypto
                    .createHash('sha1')
                    .update(contents)
                    .digest('hex')
                    .substr(0, 16);
            },
            transform(fileMeta) {
                return fileMeta;
            },
            ignore: []
        },
        userOpts
    );

    return (style, result) => {
        if (opts.basePath) {
            if (typeof opts.basePath === 'string') {
                opts.basePath = [path.resolve(opts.basePath)];
            } else {
                opts.basePath = opts.basePath.map(elem => path.resolve(elem));
            }
        } else {
            opts.basePath = [process.cwd()];
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
