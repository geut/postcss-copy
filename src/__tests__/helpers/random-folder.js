import path from 'path';
import hasha from 'hasha';

export default function randomFolder(pathname, title) {
    return path.join(
        pathname,
        hasha(title, { algorithm: 'md5' })
    );
}
