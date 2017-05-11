import mime from 'mime';

/**
 * Format the GTM event with the appropriate variables
 *
 * @param  {String} options.category [description]
 * @param  {String} options.action   [description]
 * @param  {String} options.label    [description]
 */
export const fireEvent = ({ category, action, label }) => {
    window.dataLayer.push({
        'event': 'ga.event',
        'ga.category': category,
        'ga.action': action,
        'ga.label': label,
    });
};

/**
 * Check the mime and match any images.
 *
 * @param {String} path
 */
export const isImage = (path) => {
    const mimeType = mime.lookup(path);
    if (!mimeType) {
        return false;
    }

    return mimeType.match(/^image\/.*/) !== null;
};

