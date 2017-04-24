function handleResponse(res) {
    var asset = res.assets.find(function(asset) { return asset.content_type === 'application/x-apple-diskimage'});
    if (!asset) {
        return;
    }
    var downloadButtonEl = document.querySelector('.download_button');
    downloadButtonEl.setAttribute('download', true);
    downloadButtonEl.setAttribute('href', asset.browser_download_url);
}

function fetchDownloadLink() {
    fetch('https://api.github.com/repos/busterlabs/partyshare/releases/latest')
    .then(function(res){ return res.json()})
    .then(handleResponse);
}

document.addEventListener('DOMContentLoaded', fetchDownloadLink);
