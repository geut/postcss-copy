# postcss-copy [![Build Status](https://travis-ci.org/geut/postcss-copy.svg?branch=master)](https://travis-ci.org/geut/postcss-copy) [![Build status](https://ci.appveyor.com/api/projects/status/hx0tmjv1qi0au9oy?svg=true)](https://ci.appveyor.com/project/tinchoz49/postcss-copy)
> An **async** postcss plugin to copy all assets referenced in CSS files to a custom destination folder and updating the URLs.

Sections |
--- |
[Install](#install) |
[Quick Start](#quick-start) |
[Options](#options) |
[Custom Hash Function](#custom-hash-function) |
[Input Path](#input-path) |
[Using Relative Path](#using-relative-path) |
[Transform](#using-transform) |
[Using postcss-import](#using-postcss-import) |
[Roadmap](#roadmap) |
[Credits](#credits) |


## <a name="install"></a> Install

With [npm](https://npmjs.com/package/postcss-copy) do:

```
npm install postcss-copy
```

## <a name="quick-start"></a> Quick Start

### Using [Gulp](https://github.com/postcss/gulp-postcss)

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var postcssCopy = require('postcss-copy');

gulp.task('buildCss', function () {
    var processors = [
        postcssCopy({
            src: 'src',
            dest: 'dist'
        })
    ];

    return gulp
        .src('src/**/*.css')
        .pipe(postcss(processors))
        .pipe(gulp.dest('dist'));
});
```

## <a name="options"></a> Options

#### src ({string|array} required)
Define the base src path of your CSS files.

#### dest ({string} required)
Define the dest path of your CSS files and assets.

#### template ({string | function} default = 'assets/[hash].[ext]')
Define a template name for your final url assets.
* string template
    * **[hash]**: Let you use a hash name based on the contents of the file.
    * **[name]**: Real name of your asset.
    * **[path]**: Original relative path of your asset.
    * **[ext]**: Extension of the asset.
* function template
```js
var copyOpts = {
    ...,
    template(fileMeta) {
        return 'assets/custom-name-' + fileMeta.name + '.' + fileMeta.ext;
    }
}
```

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
##### Using a string or array with minimatch support to ignore files:
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
    ignore(filename, extra) {
        return (filename.indexOf('images/button.jpg') ||
                filename.indexOf('images/background.jpg'));
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

#### <a name="input-path"></a> inputPath
Define a custom setter to define the path (dirname) of your CSS file.

postcss-copy use the ```decl.source.input.file``` to get the path of your file
and then with that information copy your assets and rewrite the urls. But some
postcss plugins
(e.g [css-modules-loader-core](https://github.com/css-modules/css-modules-loader-core))
change this attribute in here execution, soo you need to fix the path of your
read files by your own.

```js
var copyOpts = {
    ...,
    inputPath(decl) {
        // this is the input path by default
        return path.dirname(decl.source.input.file);
    }
};
```

#### <a name="using-relative-path"></a> relativePath {function}
By default the copy process keep the relative path between each ```asset``` and the path of his  ```CSS file```. You can change this behavior setting a new function with your custom relativePath. For example define the relative path based only in the ```dest``` path option (see [Using copy with postcss-import](#using-postcss-import))
```js
var copyOpts = {
    ...,
    relativePath(dirname, fileMeta, result, opts) {
        // this is the relative path by default
        return path.join(
            options.dest,
            path.relative(fileMeta.src, dirname)
        );
    }
};
```

#### <a name="using-transform"></a> transform
Extend the copy method to apply a transform in the contents (e.g: optimize images).

**IMPORTANT:** The function must return the fileMeta (modified) or a promise using ```resolve(fileMeta)```.
```js
var Imagemin = require('imagemin');

var copyOpts = {
    ...,
    transform(fileMeta) {
        return new Promise((resolve, reject) => {
            if (['jpg', 'png'].indexOf(fileMeta.ext) === -1) {
                return fileMeta;
            }
            new Imagemin()
                .src(fileMeta.contents)
                .use(Imagemin.jpegtran({
                    progressive: true
                }))
                .run((err, files) => {
                    if (err) {
                        reject(err);
                    }
                    fileMeta.contents = files[0].contents;
                    resolve(fileMeta); // <- important
                });
        });
    }
};
```

#### <a name="using-postcss-import"></a> Using copy with postcss-import
[postcss-import](https://github.com/postcss/postcss-import) is a great plugin that allow us work our css files in a modular way with the same behavior of CommonJS.
Since this plugin create at the end only one file with all your CSS files inline (loaded with the @import keyword) you need customized the ```relativePath``` function.

***One thing more...***
postcss-import has the ability of load files from node_modules. If your src folder is at the same level of node_modules like this:
```
myProject/
|-- node_modules/
|-- dest/
|-- src/
```
In this case you need define ```a multiple src```

### Full example
```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var postcssCopy = require('postcss-copy');
var postcssImport = require('postcss-import');

gulp.task('buildCss', function () {
    var processors = [
        postcssImport(),
        postcssCopy({
            src: ['src', 'node_modules'],
            dest: 'dist',
            relativePath(dirname, fileMeta, result, opts) {
                return opts.dest;
            }
        })
    ];

    return gulp
        .src('src/index.css')
        .pipe(postcss(processors, {to: 'dist/css/index.css'}))
        .pipe(gulp.dest('dist/css'));
});
```

## <a name="roadmap"></a> On roadmap

nothing for now :)

## <a name="credits"></a> Credits

* Thanks to @conradz and his rework plugin [rework-assets](https://github.com/conradz/rework-assets) my inspiration in this plugin.
* Thanks to @MoOx for let me create the copy function in his [postcss-url](https://github.com/postcss/postcss-url) plugin.
* Thanks to @webpack, i take the idea of define templates from his awesome [file-loader](https://github.com/webpack/file-loader)

## License

MIT
