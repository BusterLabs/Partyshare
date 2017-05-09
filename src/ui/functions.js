/**
 * Format the GTM event with the appropriate variables
 *
 * @param  {String} options.category [description]
 * @param  {String} options.action   [description]
 * @param  {String} options.label    [description]
 */
const fireEvent = ({ category, action, label }) => {
    window.dataLayer.push({
        'event': 'ga.event',
        'ga.category': category,
        'ga.action': action,
        'ga.label': label,
    });
};

module.exports = {
    fireEvent,
};

