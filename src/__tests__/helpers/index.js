import pathExists from 'path-exists';

export function testFileExists(t, file) {
    return pathExists(file).then(exists => {
        t.truthy(exists, `File "${file}" created.`);
    });
}

export function checkForWarnings(t, result) {
    const warnings = result.warnings();

    t.is(
        warnings.length,
        0,
        [
            'Should not had postcss warnings',
            ...warnings.map(w => w.text)
        ]
    );
}
