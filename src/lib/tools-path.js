import path from 'path';

/**
 * Quick function to find a basePath where the
 * the asset file belongs.
 *
 * @param paths
 * @param pathname
 * @returns {string|boolean}
 */
export function findBasePath(paths, pathname) {
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
 * @param basePath
 * @param result
 * @param opts
 * @returns {string}
 */
export function defineCSSDestPath(dirname, basePath, result, opts) {
    const from = path.resolve(result.opts.from);
    let to;

    if (result.opts.to) {
        /**
         * if to === from we can't use it as a valid dest path
         * e.g: gulp-postcss comes with this problem
         *
         */
        to = path.resolve(result.opts.to) === from ?
            opts.dest :
            path.dirname(result.opts.to);
    } else {
        to = opts.dest;
    }

    if (opts.preservePath) {
        let srcPath;
        let realBasePath;

        if (dirname === path.dirname(from)) {
            srcPath = dirname;
            realBasePath = basePath;
        } else {
            /**
             * dirname !== path.dirname(result.opts.from) means that
             * postcss-import is grouping different css files in
             * only one destination, so, the relative path must be defined
             * based on the CSS file where we read the @imports
             */
            srcPath = path.dirname(from);
            realBasePath = findBasePath(opts.basePath, from);
        }

        return path.join(to, path.relative(realBasePath, srcPath));
    }

    return to;
}

