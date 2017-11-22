import mime from 'mime';

/**
 * Check the mime and match any images.
 *
 * @param {String} path
 * @return {Boolean}
 */
export const isImage = (path) => {
    const mimeType = mime.getType(path);
    if (!mimeType) {
        return false;
    }

    return mimeType.match(/^image\/.*/) !== null;
};

