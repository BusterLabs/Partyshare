if (!String.prototype.endsWith)
String.prototype.endsWith = function(searchStr, Position) {
    // This works much better than >= because
    // it compensates for NaN:
    if (!(Position < this.length))
      Position = this.length;
    else
      Position |= 0; // round position
    return this.substr(Position - searchStr.length,
                       searchStr.length) === searchStr;
};

function setDownloadLinkToSelector(selector, link) {
    var downloadButtonEl = document.querySelector(selector);
    downloadButtonEl.setAttribute('download', true);
    downloadButtonEl.setAttribute('href', link);
    downloadButtonEl.removeAttribute('disabled');
}

function findAndAppendAssetUrlToSelector(assets, extension, selector) {
    var asset = assets.find(function(asset) { return asset.name.endsWith(extension)});
    if (!asset) {
        return;
    }

    setDownloadLinkToSelector(selector, asset.browser_download_url)
}

function handleResponse(res) {
    findAndAppendAssetUrlToSelector(res.assets, '.AppImage', '.js-download-mac');
    findAndAppendAssetUrlToSelector(res.assets, '.dmg', '.js-download-linux');
}

function fetchDownloadLink() {
    fetch('https://api.github.com/repos/busterlabs/partyshare/releases/latest')
    .then(function(res){ return res.json()})
    .then(handleResponse);
}

document.addEventListener('DOMContentLoaded', fetchDownloadLink);
