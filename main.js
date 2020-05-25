// Match ANSI escape code
const pattern = /\[\d+;?\d*m/g;

// ANSI escape code
const colorCodes = {
    '[2m': 'opacity:0.75',
    '[31m': 'color:red',
    '[32m': 'color:green',
    '[33m': 'color:gold',
    '[35m': 'color:purple',
    '[36m': 'color:darkblue',
    '[94m': 'color:lightblue',
    '[0;39m': '</span>',
    '[39m': '</span>',
};

// ANSI escape code to HTML
const codeToSpan = (code) => {
    if (!colorCodes[code]) {
        return code;
    }
    if (code === '[0;39m' || code === '[39m') {
        return colorCodes[code];
    }
    return `<span style="${colorCodes[code]};-webkit-animation-duration:unset;">`;
};

// Replace ANSI escape code to HTML
const callback = (mutationsList) => {
    mutationsList.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
            if (node.classList && (node.classList.contains('cwdb-log-viewer-table-row-group') || node.classList.contains('cwdb-log-viewer-table-row-details'))) {
                node.innerHTML = node.innerHTML.replace(pattern, function (code) {
                    return codeToSpan(code);
                });
            }
        });
    });
};

// Observe DOM changes
var node = document.getElementById('b');
if (node) {
    var observer = new MutationObserver(callback);
    observer.observe(node, { subtree: true, childList: true });
}