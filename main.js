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
const replaceCode = (node) => {
    node.innerHTML = node.innerHTML.replace(pattern, (code) => {
        if (!colorCodes[code]) {
            return code;
        }
        if (code === '[0;39m' || code === '[39m') {
            return colorCodes[code];
        }
        return `<span style="${colorCodes[code]};-webkit-animation-duration:unset;">`;
    });
};

const callbackV2 = (mutationsList) => {
    mutationsList.forEach((mutation) => {
        let target = mutation.target;

        if (mutation.addedNodes.length > 0) {
            let addedNode = mutation.addedNodes[0];

            // Initial logs
            if (addedNode.nodeName === 'SPAN' && addedNode.classList.length === 0 && target.nodeName === 'SPAN' && target.classList.length === 0 && !target.id) {
                let events = addedNode.querySelectorAll('span.logs__log-events-table__cell');
                if (events.length > 0) {
                    let node = events[0].firstChild;
                    if (node.classList.length === 0) {
                        replaceCode(node);
                    }
                }
            }

            // When a line is clicked
            let isShow = addedNode.nodeName === 'DIV' && mutation.previousSibling && mutation.previousSibling.classList && mutation.previousSibling.classList.contains('logs__log-events-table__cell');
            if (isShow) {
                replaceCode(addedNode);
            }
        }

        // Loaded logs
        let tr = target.parentNode ? target.parentNode.closest('tr') : undefined;
        let cell = tr ? tr.querySelectorAll('span.logs__log-events-table__cell') : undefined;
        if (mutation.type === 'characterData' && tr && cell.length > 1) {
            replaceCode(cell[1].firstChild);
        }
    });
};

// Replace ANSI escape code to HTML
const callback = (mutationsList) => {
    mutationsList.forEach((mutation) => {
        // V1
        if (mutation.target.classList.contains('cwdb-log-viewer-table-body') || mutation.target.classList.contains('cwdb-log-viewer-table-row-group')) {
            mutation.addedNodes.forEach((node) => {
                let messages = node.querySelectorAll('div.cwdb-ellipsis, div.content');
                if (messages.length > 0) {
                    replaceCode(messages[0]);
                }
            });
        }

        // V2
        if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains('cwdb-micro-console-Logs') || (mutation.target && mutation.target.id === 'gwt-debug-dashboards')) {
            let iframe = document.getElementById('microConsole-Logs');
            if (iframe) {
                new MutationObserver(callbackV2).observe(iframe.contentWindow.document.body, { subtree: true, childList: true, characterData: true });
            }
        }
    });
};

// Observe DOM changes
var node = document.getElementById('c');
if (node) {
    new MutationObserver(callback).observe(node, { subtree: true, childList: true });
}