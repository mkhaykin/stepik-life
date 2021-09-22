// flag for load data from /status
var flgWaitForStatus = false;   // flag for concurrent render
var flgWaitForNext = false;     // flag for concurrent next generation

var timerId;                    // timer for auto update
// for settings
var table_height = -1;
var table_width = -1;

init();

function init() {
    render_main();                  // draw table
}

function get_json(url, callback, json=null, callback_onerror=null) {
    // url              - url for request
    // callback         - function on load
    // json             - json to post on url
    // callback_onerror - function on error
    var xhr = new XMLHttpRequest();
    xhr.open(json !== null ? 'POST' : 'GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    xhr.onload = function () {
        callback(xhr.status, xhr.response);
    }
    if (callback_onerror) {
        xhr.onerror = function() {
            callback_onerror(xhr.status);
        }
    }

    xhr.send(JSON.stringify(json));
}

function New() {
    const json = {
        "height": table_height,
        "width": table_width
    }
    get_json('/new', new_onload, json);
}

function new_onload(status, json) {
    render_main();
}

function Next(){
    if (!flgWaitForNext) {
        flgWaitForNext = true;
        get_json('/nextstep', next_onload);
    }
}

function next_onload(status, json) {
    render_main();
    flgWaitForNext = false;
}

function Auto() {
    var btn = document.getElementById('btn_auto');
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
        btn.innerHTML = 'start auto';
    } else {
        timerId = setInterval(() => Next(), 1000);
        btn.innerHTML = 'stop auto';
    }
}

function Settings() {
    document.getElementById('rangeValue_h').innerHTML = table_height;   // (((
    document.getElementById('rangeValue_w').innerHTML = table_width;    // (((
    document.getElementById('size_h').value = table_height;
    document.getElementById('size_w').value = table_width;

    if (! document.getElementById('content-settings').hidden) {
        document.getElementById('content-settings').hidden = true;
    } else {
        document.getElementById('content-settings').hidden = false;
    }
}

function SetApply() {
    let size_h = document.getElementById('size_h').value;
    let size_w = document.getElementById('size_w').value;
    resize(size_h, size_w);
}

function resize(height, width) {
    const json = {
        "height": height,
        "width": width
    }
    get_json('/new', new_onload, json);
}

function new_onload(status, json) {
    render_main();
}

function SetBack() {
    document.getElementById('content-settings').hidden = true;
}

function TableClear() {
    var table = document.getElementById('life_table');
    var l = table.rows.length-1;
    for (var i=0; i <= l; i++) {
        table.deleteRow(0);
    }
}

function TableDraw(col, row, step, world, world_prev){
    // исправить: всегда перерисовываем (((
    var table = document.getElementById('life_table');
    document.getElementById('step_count').innerHTML = step

    TableClear();

    for (var i = row - 1; i >= 0; i--) {
        let x = table.insertRow(0);
        for (var j=0; j < col; j++) {
            table.rows[0].insertCell(j);
            table.rows[0].cells[j].id = 'td' + i + '_' + j
            table.rows[0].cells[j].classList.add('cell');
            if (world) {
                if (world[i][j] == 1) {
                    // table.rows[0].cells[j].classList.remove('cell');
                    table.rows[0].cells[j].classList.add('living-cell');
                } else {
                    if (world_prev[i][j] == 1) {
                        // table.rows[0].cells[j].classList.remove('cell');
                        table.rows[0].cells[j].classList.add('dead-cell');
                    }
                }
            }
        }
    }
}

function render_main() {
    if (!flgWaitForStatus) {
        flgWaitForStatus = true;
        get_json('/status', render_main_onload);
    }
}

function render_main_onload(status, json) {
    const data = JSON.parse(json);
    table_height = data.height;
    table_width = data.width
    TableDraw(data.width, data.height, data.step, data.world, data.world_prev);
    flgWaitForStatus = false;
}
