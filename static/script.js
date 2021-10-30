// flag for load data from /status
var flgWaitForStatus = false;   // flag for concurrent render
var flgWaitForNext = false;     // flag for concurrent next generation
var flgWaitForNew = false;      // flag for concurrent world generation

var timerId;                    // timer for auto update
// for settings
var tableHeight = -1;
var tableWidth = -1;

var timeoutWordChange = 1000; // время для отображения изменений
var timeoutAutoUpdate = 3000; // время для авто счетчика


init();

function init() {
    render_main();                  // draw table
}

function get_json(url, json=null, callback=null, callback_onerror=null) {
    // url              - url for request
    // callback         - function on load
    // json             - json to post on url
    // callback_onerror - function on error
    var xhr = new XMLHttpRequest();
    xhr.open(json !== null ? 'POST' : 'GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    if (callback) {
        xhr.onload = function () {
            callback(xhr.status, xhr.response);
        }
    }
    if (callback_onerror) {
        xhr.onerror = function() {
            callback_onerror(xhr.status);
        }
    }
    xhr.send(JSON.stringify(json));
}

function setStatusOK() {
    document.getElementById('status').innerHTML = 'ok';
}

function setStatusError() {
    document.getElementById('status').innerHTML = 'error connect to server. try later.';
}

function New() {
    if (!flgWaitForNew) {
        flgWaitForNew = true;
        const json = {
            "height": tableHeight,
            "width": tableWidth
        }
        get_json('/new', json, new_onload, new_onerror);
    }
}

function new_onload(status, json) {
    render_main();
    setStatusOK();
    flgWaitForNew = false;
}

function new_onerror(status) {
    setStatusError();
    flgWaitForNew = false;
}

function Next(){
    if (!flgWaitForNext) {
        flgWaitForNext = true;
        get_json('/nextstep', null, next_onload, next_onerror);
    }
}

function next_onload(status, json) {
    render_main();
    setStatusOK();
    flgWaitForNext = false;
}

function next_onerror(status) {
    setStatusError();
    flgWaitForNext = false;
}

function Auto() {
    var btn = document.getElementById('btn_auto');
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
        btn.innerHTML = 'start auto';
    } else {
        timerId = setInterval(() => Next(), timeoutAutoUpdate);
        btn.innerHTML = 'stop auto';
    }
}

function Settings() {
    document.getElementById('rangeValue_h').innerHTML = tableHeight;   // (((
    document.getElementById('rangeValue_w').innerHTML = tableWidth;    // (((
    document.getElementById('size_h').value = tableHeight;
    document.getElementById('size_w').value = tableWidth;

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
    SetBack(); // close settings
}

function resize(height, width) {
    const json = {
        "height": height,
        "width": width
    }
    get_json('/new', json, new_onload);
}

function SetBack() {
    document.getElementById('content-settings').hidden = true;
}

function TableDrop() {
    // TODO как то быстро очищать таблицу, а не удалять построчно
    var table = document.getElementById('life_table');
    var l = table.rows.length-1;
    for (var i=0; i <= l; i++) {
        table.deleteRow(0);
    }
}

function TableDrawBlank(col, row) {
    var table = document.getElementById('life_table');

    // удаляем таблицу
    TableDrop();
    // TODO сделать нормальную генерацию, а не вставлять в позицию 0.
    // генерируем заново
    for (var i = row - 1; i >= 0; i--) {
        let x = table.insertRow(0);
        for (var j=0; j < col; j++) {
            table.rows[0].insertCell(j);
            table.rows[0].cells[j].id = 'td' + i + '_' + j
            table.rows[0].cells[j].classList = 'cell';
        }
    }
}

// генерация мира с промежуточными изменениями: живые, пустые, новые, умирают
function TableDrawChange(table, col, row, world, world_change){
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (world_change[i][j] == 1) {
                table.rows[i].cells[j].classList = 'cell new-cell';
            } else if (world_change[i][j] == -1) {
                table.rows[i].cells[j].classList = 'cell dead-cell';
            } else {
                if (world[i][j] == 1) {
                    table.rows[i].cells[j].classList = 'cell living-cell';
                } else {
                    table.rows[i].cells[j].classList = 'cell blank-cell';
                }
            }
        }
    }
}

// отрисовка мира (живые/пустые)
function TableDrawWorld(table, col, row, world){
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (world) {
                if (world[i][j] == 1) {
                    table.rows[i].cells[j].classList = 'cell living-cell';
                } else {
                    table.rows[i].cells[j].classList = 'cell blank-cell';
                }
            }
        }
    }
}

function TableDraw(col, row, step, world, world_change, world_prev){
    var table = document.getElementById('life_table');
    document.getElementById('step_count').innerHTML = step;

    // Отрисовываем ожидаемые изменения
    TableDrawChange(table, col, row, world, world_change);
    // Пауза в течение 3 секунд. И рисуем мир.
    setTimeout(() => TableDrawWorld(table, col, row, world), timeoutWordChange);
}

function render_main() {
    if (!flgWaitForStatus) {
        flgWaitForStatus = true;
        get_json('/status', null, render_main_onload, render_main_onerror);
    }
}

function render_main_onload(status, json) {
    const data = JSON.parse(json);
    tableHeight = data.height;
    tableWidth = data.width;
    TableDrawBlank(data.width, data.height);
    TableDraw(data.width, data.height, data.step, data.world, data.world_change, data.world_prev);
    setStatusOK();
    flgWaitForStatus = false;
}

function render_main_onerror(status) {
    tableHeight = -1;
    tableWidth = -1;

    TableDrop();
    setStatusError();
    flgWaitForStatus = false;
}
