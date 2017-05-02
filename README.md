# postcss-copy
[![Build Status](https://travis-ci.org/geut/postcss-copy.svg?branch=master)](https://travis-ci.org/geut/postcss-copy)
[![Build status](https://ci.appveyor.com/api/projects/status/hx0tmjv1qi0au9oy?svg=true)](https://ci.appveyor.com/project/tinchoz49/postcss-copy)
[![Coverage Status](https://coveralls.io/repos/github/geut/postcss-copy/badge.svg?branch=master)](https://coveralls.io/github/geut/postcss-copy?branch=master)
[![Dependency Status](https://david-dm.org/geut/postcss-copy.svg)](https://david-dm.org/geut/postcss-copy)
[![devDependency Status](https://david-dm.org/geut/postcss-copy/dev-status.svg)](https://david-dm.org/geut/postcss-copy#info=devDependencies)
> An **async** postcss plugin to copy all assets referenced in CSS files to a custom destination folder and updating the URLs.

Sections |
--- |
[Install](#install) |
[Quick Start](#quick-start) |
[Options](#options) |
[Custom Hash Function](#custom-hash-function) |
[Transform](#using-transform) |
[Using postcss-import](#using-postcss-import) |
[About lifecyle and the fileMeta object](#lifecyle) |
[Roadmap](#roadmap) |
[Credits](#credits) |


## <a name="install"></a> Install

With [npm](https://npmjs.com/package/postcss-copy) do:

```
$ npm install postcss-copy
```

## <a name="quick-start"></a> Quick Start

### Using [postcss-cli](https://github.com/postcss/postcss-cli)
```js
// postcss.config.js
module.exports = {
    plugins: [
        require('postcss-copy')({
            dest: 'dist'
        })
    ]
};
```
```bash
$ postcss src/index.css
```

### Using [Gulp](https://github.com/postcss/gulp-postcss)

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var postcssCopy = require('postcss-copy');

gulp.task('buildCss', function () {
    var processors = [
        postcssCopy({
            basePath: ['src', 'otherSrc']
            dest: 'dist'
        })
    ];

    return gulp
        .src(['src/**/*.css', 'otherSrc/**/*.css'])
        .pipe(postcss(processors))
        .pipe(gulp.dest('dist'));
});
```

## <a name="options"></a> Options

#### basePath ({string|array} default = process.cwd())
Define one/many base path for your CSS files.

#### dest ({string} required)
Define the dest path of your CSS files and assets.

#### template ({string | function} default = '[hash].[ext][query]')
Define a template name for your final url assets.
* string template
    * **[hash]**: Let you use a hash name based on the contents of the file.
    * **[name]**: Real name of your asset.
    * **[path]**: Original relative path of your asset.
    * **[ext]**: Extension of the asset.
    * **[query]**: Query string.
    * **[qparams]**: Query string params without the ```?```.
    * **[qhash]**: Query string hash without the ```#```.
* function template
```js
var copyOpts = {
    ...,
    template(fileMeta) {
        return 'assets/custom-name-' + fileMeta.name + '.' + fileMeta.ext;
    }
}
```

#### preservePath ({boolean} default = false)
Flag option to notify to postcss-copy that your CSS files destination are going to preserve the directory structure.
It's helpful if you are using `postcss-cli` with the --base option or `gulp-postcss` with multiple files (e.g: `gulp.src('src/**/*.css')`)

#### ignore ({string | string[] | function} default = [])
Option to ignore assets in your CSS file.

##### Using the ```!``` key in your CSS:
```css
.btn {
    background-image: url('!images/button.jpg');
}
.background {
    background-image: url('!images/background.jpg');
}
```

##### Using a string or array with [micromatch](https://github.com/jonschlinkert/micromatch) support to ignore files:
```js
// ignore with string
var copyOpts = {
    ...,
    ignore: 'images/*.jpg'
}
// ignore with array
var copyOpts = {
    ...,
    ignore: ['images/button.+(jpg|png)', 'images/background.jpg']
}
```
##### Using a custom function:
```js
// ignore function
var copyOpts = {
    ...,
    ignore(fileMeta, opts) {
        return (fileMeta.filename.indexOf('images/button.jpg') ||
                fileMeta.filename.indexOf('images/background.jpg'));
    }
}
```

#### <a name="custom-hash-function"></a> hashFunction
Define a custom function to create the hash name.
```js
var copyOpts = {
    ...,
    hashFunction(contents) {
        // borschik
        return crypto.createHash('sha1')
            .update(contents)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
            .replace(/^[+-]+/g, '');
    }
};
```

#### <a name="using-transform"></a> transform
Extend the copy method to apply a transform in the contents (e.g: optimize images).

**IMPORTANT:** The function must return the fileMeta (modified) or a promise using ```resolve(fileMeta)```.
```js
var Imagemin = require('imagemin');
var imageminJpegtran = require('imagemin-jpegtran');
var imageminPngquant = require('imagemin-pngquant');

var copyOpts = {
    ...,
    transform(fileMeta) {
        if (['jpg', 'png'].indexOf(fileMeta.ext) === -1) {
            return fileMeta;
        }
        return Imagemin.buffer(fileMeta.contents, {
            plugins: [
                imageminPngquant(),
                imageminJpegtran({
                    progressive: true
                })
            ]
        })
        .then(result => {
            fileMeta.contents = result;
            return fileMeta; // <- important
        });
    }
};
```

#### <a name="using-postcss-import"></a> Using copy with postcss-import
[postcss-import](https://github.com/postcss/postcss-import) is a great plugin that allow us work our css files in a modular way with the same behavior of CommonJS.

***One thing more...***
postcss-import has the ability of load files from node_modules. If you are using a custom `basePath` and you want to
track your assets from `node_modules` you need to add the `node_modules` folder in the `basePath` option:

```
myProject/
|-- node_modules/
|-- dest/
|-- src/
```

### Full example
```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var postcssCopy = require('postcss-copy');
var postcssImport = require('postcss-import');
var path = require('path');

gulp.task('buildCss', function () {
    var processors = [
        postcssImport(),
        postcssCopy({
            basePath: ['src', 'node_modules'],
            preservePath: true,
            dest: 'dist'
        })
    ];

    return gulp
        .src('src/**/*.css')
        .pipe(postcss(processors, {to: 'dist/css/index.css'}))
        .pipe(gulp.dest('dist/css'));
});
```

#### <a name="lifecyle"></a> About lifecyle and the fileMeta object
The fileMeta is a literal object with meta information about the copy process. Its information grows with the progress of the copy process.

The lifecyle of the copy process is:

1. Detect the url in the CSS files
2. Validate url
3. Initialize the fileMeta:

    ```js
    {
        sourceInputFile, // path to the origin CSS file
        sourceValue, // origin asset value taked from the CSS file
        filename, // filename normalized without query string
        absolutePath, // absolute path of the asset file
        fullName, // name of the asset file
        path, // relative path of the asset file
        name, // name without extension
        ext, // extension name
        query, // full query string
        qparams, // query string params without the char '?'
        qhash, // query string hash without the char '#'
        basePath // basePath found
    }
    ```
4. Check ignore function
5. Read the asset file (using a cache buffer if exists)
6. Add ```content``` property in the fileMeta object
7. Execute custom transform
8. Create hash name based on the custom transform
9. Add ```hash``` property in the fileMeta object
10. Define template for the new asset
11. Add ```resultAbsolutePath``` and ```extra``` properties in the fileMeta object
12. Write in destination
13. Write the new URL in the PostCSS node value.

## <a name="roadmap"></a> On roadmap

nothing for now :)

## <a name="credits"></a> Credits

* Thanks to @conradz and his rework plugin [rework-assets](https://github.com/conradz/rework-assets) my inspiration in this plugin.
* Thanks to @MoOx for let me create the copy function in his [postcss-url](https://github.com/postcss/postcss-url) plugin.
* Thanks to @webpack, i take the idea of define templates from his awesome [file-loader](https://github.com/webpack/file-loader)
* Huge thanks to @TrySound for his work in this project.

## License

MIT
