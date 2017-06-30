# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [7.1.0] - 2017-06-30
### Fixed
- Wrong encode in paths with spaces: #54

## [7.0.0] - 2017-05-06
### Added
- preservePath option to work with gulp or postcss-cli and their --base option

### Changed
- _breaking change_: The `src` option is ambiguous to the real objective, so I changed it to `basePath`
- `basePath` (old `src`) is now optional and the default path is `process.cwd()`

### Removed
- relativePath and inputPath in favor of simplify the API of postcss-copy

## [6.2.1] - 2016-12-07 [YANKED]

## [6.2.0] - 2016-12-06
### Added
- cache for the write process to don\`t overwrite the output file (fixed race condition)

## [6.1.0] - 2016-12-02
### Fixed
- concurrent tests and cache function for the transform process
- hash parameter content

## [6.0.0] - 2016-11-30
### Changed
- execution of transform function: run before of the hash function (#49)

## [5.3.0] - 2016-10-10
### Fixed
- sould not repeat the transform process when the source is the same (related #46)

## [5.2.0] - 2016-09-18
### Fixed
- relativePath must return a valid dirname

## [5.1.0] - 2016-09-18
### Fixed
- a regression in the relativePath usage :bug:

## [5.0.1] - 2016-07-20
### Added
- CI for node v6

### Fixed
- revert update of eslint and path-exists since the new versions does not work with node v0.12

## [5.0.0] - 2016-07-20
### Added
- Query string attributes in the fileMeta: **query**, **qparams** and **qhash**
- sourceInputFile attribute in the fileMeta
- sourceValue attribute in the fileMeta

### Changed
- Change default template to `[hash].[ext][query]` **(Breaking change)**

## [4.0.2] - 2016-04-22
### Fixed
- issue with the ignore option

## [4.0.1] - 2016-04-21
### Removed
- warning for ignore files

## [4.0.0] - 2016-04-18
### Added
- Coverage support

### Changed
- Best ignore behaviour. Pass the fileMeta to the ignore function. [#33](https://github.com/geut/postcss-copy/issues/33)
- Change default template with `'[hash].[ext]'`.
- Replace minimatch by micromatch.
- Use keepachangelog format.

## [3.1.0] - 2016-02-23
### Added
- Appveyor support @TrySound
- Cache support wth watcher ability. Before nothing copy if dest exists @TrySound

### Changed
- Refactory source code @TrySound
- Refactory tests. Replace tape by ava @TrySound
- Improve package.json @TrySound
- Update dependencies and devDependencies @TrySound

### Fixed
- Fix path resolving

## [3.0.0] - 2016-02-12
### Changed
- replace keepRelativePath by relativePath custom function

## [2.6.3] - 2016-02-12 [YANKED]

## [2.6.2] - 2016-02-12 [YANKED]

## [2.6.1] - 2016-02-11
### Fixed
- replace `_extend` by `Object.assign`

## [2.6.0] - 2016-02-10 [YANKED]

## [2.5.0] - 2016-02-09
### Added
- minimatch support for ignore option

## [2.4.1] - 2016-02-09 [YANKED]

## [2.4.0] - 2016-02-01
### Fixed
- Correct parse/replace url - issue [#4](https://github.com/geut/postcss-copy/issues/4)

## [2.3.9] - 2015-12-10
### Fixed
- issue #3 ([320507e](https://github.com/geut/postcss-copy/commit/320507e))

## [2.3.8] - 2015-11-07 [YANKED]

## [2.3.7] - 2015-11-07
### Added
- add conventional changelog

## [2.3.6] - 2015-11-06 [YANKED]

## [2.3.5] - 2015-11-06 [YANKED]

## [2.3.4] - 2015-11-06 [YANKED]

## [2.3.3] - 2015-11-06 [YANKED]

## [2.3.2] - 2015-11-06
### Changed
- rename transformPath to inputPath

## [2.3.1] - 2015-11-06 [YANKED]

## [2.3.0] - 2015-11-05
### Changed
- Refactory source code

## [2.2.13] - 2015-10-06 [YANKED]

## [2.2.12] - 2015-10-06
### Fixed
- fix error with the parse url (pathname) when the directories has empty spaces

## [2.2.11] - 2015-10-06
### Changed
- Update travis
- Update readme with vertical section contents and more examples

### Fixed
- Minor error using postcss-copy with postcss-import

## [2.2.10] - 2015-09-18
### Changed
- return early when processing data/absolute/hash urls

## [2.2.9] - 2015-09-16
### Added
- new tests to check the correct multiple url parser

### Fixed
- error with multiple urls in one line, e.g fonts of bootstrap

## [2.2.2] - 2015-09-14
### Changed
- simple refactory in copyFile func

### Fixed
- issue allow extra rules before/after url [#1](https://github.com/geut/postcss-copy/issues/1)

## [2.2.1] - 2015-09-14 [YANKED]

## [2.2.0] - 2015-09-14
### Added
- new option/feature: transform and add test for it
- eslint in test script

## [2.1.7] - 2015-09-13 [YANKED]

## [2.1.3] - 2015-09-07 [YANKED]

## [2.1.1] - 2015-09-07 [YANKED]

## [2.1.0] - 2015-09-07 [YANKED]

## [2.0.1] - 2015-09-07 [YANKED]

## [2.0.0] - 2015-09-07
### Changed
- Switch to PostCSS Async
- Remove the fs-extra dependency

## [1.1.3] - 2015-09-06 [YANKED]

## [1.1.2] - 2015-09-05 [YANKED]

## 1.1.0 - 2015-09-05
- First release tagged!

[unreleased]: https://github.com/geut/postcss-copy/compare/v7.1.0...HEAD
[7.1.0]: https://github.com/geut/postcss-copy/compare/v7.0.0...v7.1.0
[7.0.0]: https://github.com/geut/postcss-copy/compare/v6.2.1...v7.0.0
[6.2.1]: https://github.com/geut/postcss-copy/compare/v6.2.0...v6.2.1
[6.2.0]: https://github.com/geut/postcss-copy/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/geut/postcss-copy/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/geut/postcss-copy/compare/v5.3.0...v6.0.0
[5.3.0]: https://github.com/geut/postcss-copy/compare/v5.2.0...v5.3.0
[5.2.0]: https://github.com/geut/postcss-copy/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/geut/postcss-copy/compare/v5.0.1...v5.1.0
[5.0.1]: https://github.com/geut/postcss-copy/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/geut/postcss-copy/compare/v4.0.2...v5.0.0
[4.0.2]: https://github.com/geut/postcss-copy/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/geut/postcss-copy/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/geut/postcss-copy/compare/v3.1.0...v4.0.0
[3.1.0]: https://github.com/geut/postcss-copy/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/geut/postcss-copy/compare/v2.6.3...v3.0.0
[2.6.3]: https://github.com/geut/postcss-copy/compare/v2.6.2...v2.6.3
[2.6.2]: https://github.com/geut/postcss-copy/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/geut/postcss-copy/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/geut/postcss-copy/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/geut/postcss-copy/compare/v2.4.1...v2.5.0
[2.4.1]: https://github.com/geut/postcss-copy/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/geut/postcss-copy/compare/v2.3.9...v2.4.0
[2.3.9]: https://github.com/geut/postcss-copy/compare/v2.3.8...v2.3.9
[2.3.8]: https://github.com/geut/postcss-copy/compare/v2.3.7...v2.3.8
[2.3.7]: https://github.com/geut/postcss-copy/compare/v2.3.6...v2.3.7
[2.3.6]: https://github.com/geut/postcss-copy/compare/v2.3.5...v2.3.6
[2.3.5]: https://github.com/geut/postcss-copy/compare/v2.3.4...v2.3.5
[2.3.4]: https://github.com/geut/postcss-copy/compare/v2.3.3...v2.3.4
[2.3.3]: https://github.com/geut/postcss-copy/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/geut/postcss-copy/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/geut/postcss-copy/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/geut/postcss-copy/compare/v2.2.13...v2.3.0
[2.2.13]: https://github.com/geut/postcss-copy/compare/v2.2.12...v2.2.13
[2.2.12]: https://github.com/geut/postcss-copy/compare/v2.2.11...v2.2.12
[2.2.11]: https://github.com/geut/postcss-copy/compare/v2.2.10...v2.2.11
[2.2.10]: https://github.com/geut/postcss-copy/compare/v2.2.9...v2.2.10
[2.2.9]: https://github.com/geut/postcss-copy/compare/v2.2.2...v2.2.9
[2.2.2]: https://github.com/geut/postcss-copy/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/geut/postcss-copy/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/geut/postcss-copy/compare/v2.1.7...v2.2.0
[2.1.7]: https://github.com/geut/postcss-copy/compare/v2.1.3...v2.1.7
[2.1.3]: https://github.com/geut/postcss-copy/compare/v2.1.1...v2.1.3
[2.1.1]: https://github.com/geut/postcss-copy/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/geut/postcss-copy/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/geut/postcss-copy/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/geut/postcss-copy/compare/v1.1.3...v2.0.0
[1.1.3]: https://github.com/geut/postcss-copy/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/geut/postcss-copy/compare/v1.1.0...v1.1.2
