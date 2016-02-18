import escapeStringRegexp from 'escape-string-regexp';

export default function makeRegex(str, simple = false) {
    let value;
    if (simple) {
        value = str;
    } else {
        value = '(\'' + str + '\')';
    }
    return new RegExp(escapeStringRegexp(value));
}
