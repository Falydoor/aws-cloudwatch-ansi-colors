// Match ANSI escape code

const escape_codes = new Map(
    [
        ['0', 'font-weight:normal'],
        ['1', 'font-weight:bold'],
        ['2', 'opacity:0.75'],
        ['4', 'text-decoration:underline'],
        ['30', 'color:darkslategray'],
        ['31', 'color:darkred'],
        ['32', 'color:darkgreen'],
        ['33', 'color:darkgoldenrod'],
        ['34', 'color:darkblue'],
        ['35', 'color:indigo'],
        ['36', 'color:darkcyan'],
        ['39', 'color:black'],
        ['90', 'color:darkgrey'],
        ['91', 'color:red'],
        ['92', 'color:green'],
        ['93', 'color:goldenrod'],
        ['94', 'color:blue'],
        ['95', 'color:darkviolet'],
        ['96', 'color:cyan'],
        ['97', 'color:whitesmoke']
    ]
);

const match_pattern = /[\u001b]+(?:\[(\d+;?)*m)?/;


const maybeReplaceText = (content) => {

    if ((content || "").trim().length === 0){
        return null;
    }

    let span_open = 0;
    let match = content.match(match_pattern);
    if(match === null){
        return null;
    }
    while (match !== null) {
        if (match.length === 1) {
            content = content.replace(match_pattern, "");
            match = content.match(match_pattern)
            continue;
        }
        let modifiers = match.slice(1);
        if(JSON.stringify(modifiers) === '["0"]') {
            let replacement = "";
            if (span_open > 0) {
                replacement = "</span>";
                span_open -= 1;
            }
            content = content.replace(match_pattern, replacement);
            span_open = false;
            match = content.match(match_pattern)
            continue;
        }
        let styles = modifiers.map(code => escape_codes.get(code)).filter(code => code !== undefined);
        content = content.replace(match_pattern, `<span style="${styles.join(";")};-webkit-animation-duration:unset;">`);
        span_open += 1;
        match = content.match(match_pattern)
    }
    while (span_open > 0) {
        content = content + '</span>';
        span_open -= 1;
    }
    return content;
};

const maybeUpdateNode = (node) => {
    let updated = maybeReplaceText(node.innerHTML);
    if (updated !== null) {
        node.innerHTML = updated;
        return true;
    }
    return false
}


function recurseNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.nodeName !== "SPAN" && node.nodeName !== "DIV") {
            continue;
        }
        let updated = false;
        if (
            (node.dataset !== undefined && node.dataset.testid === 'logs__log-events-table__message') ||
            (node.classList.contains('logs__log-events-table__content')  && node.parentNode.dataset.testid === 'logs__log-events-table__formatted-message')
        ){
            updated = maybeUpdateNode(node);
        }
        if (node.childNodes !== undefined && !updated) {
            recurseNodes(node.childNodes);
        }
    }
}


const callbackV2 = (mutationsList) => {

    mutationsList.forEach((mutation) => {
        let target = mutation.target;
        if (mutation.type === 'characterData') {
            let tr = target.parentNode ? target.parentNode.closest('tr') : undefined;
            let cell = tr ? tr.querySelectorAll('span.logs__log-events-table__cell') : undefined;
            if (tr && cell.length > 1) {
                maybeUpdateNode(cell[1].firstChild);
            }
            return;
        }

        let len_nodes = mutation.addedNodes.length;

        if (mutation.type !== 'childList' || len_nodes === 0) {
            return;
        }

        if (target.nodeName === "DIV" && target.classList.contains('logs__log-events-table__content') && target.parentNode.dataset !== undefined && target.parentNode.dataset.testid === 'logs__log-events-table__formatted-message') {
            for (let i = 0; i < len_nodes; i++) {
                let node = mutation.addedNodes[i];
                if (node.nodeName === "#text") {
                    maybeUpdateNode(target);
                    break
                }
            }
        }


        if(target.nodeName === 'SPAN' && target.classList.length === 0 && !target.id && target.dataset !== undefined  && target.dataset.testid === 'logs__log-events-table__message'){
            for (let i = 0; i < len_nodes; i++) {
                let node = mutation.addedNodes[i];
                if (node.nodeName === "#text") {
                    maybeUpdateNode(target);
                    break
                }
            }
        }

        recurseNodes(mutation.addedNodes);


        let addedNode = mutation.addedNodes[0];

        // When a line is clicked
        let isShow = addedNode.nodeName === 'DIV' && mutation.previousSibling && mutation.previousSibling.classList && mutation.previousSibling.classList.contains('logs__log-events-table__cell');
        if (isShow) {
            maybeUpdateNode(addedNode);
        }

    });
};

// Replace ANSI escape code to HTML
const callback = (mutationsList) => {
    let mutations = mutationsList.map((x) => x);  // shallow copy mutations
    mutations.forEach((mutation) => {
        // V1
        if (mutation.target.classList.contains('cwdb-log-viewer-table-body') || mutation.target.classList.contains('cwdb-log-viewer-table-row-group')) {
            mutation.addedNodes.forEach((node) => {
                let messages = node.querySelectorAll('div.cwdb-ellipsis, div.content');
                if (messages.length > 0) {
                    maybeUpdateNode(messages[0]);
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
