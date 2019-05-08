let textarea = $('#note-text');
var fs = require('fs');

var storagePath = app.getPath('userData');

//预设notesid
let notesid = 0;

//标记
let isNotesEmpty;

//从主线程获取global
global.indebug = remote.getGlobal('indebug');

if (global.indebug) {
    if (!fs.existsSync(storagePath + '/devTemp/')) {
        fs.mkdirSync(storagePath + '/devTemp/');
    }
}

//获取notesid的数据
storage.get('notesid' + (global.indebug ? '_dev' : ''), function (error, data) {
    if (error) {
        notesid = 0;
        return;
    } else {
        //获取callback回传的json
        var notesid_json = data;
        if (typeof notesid_json.id != 'undefined') {
            if (notesid_json.id >= 0) {
                notesid = notesid_json.id;
            } else {
                notesid = 0;
            }
        } else {
            notesid = 0;
            return;
        }
    }
});

readNoteFiles();

//绑定textarea的事件
let isComboKeyDown = false; //防止反复触发
textarea.keydown(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && e.keyCode == 13 && !isComboKeyDown) {
        isComboKeyDown = true;
        var text = textarea.val().trim();
        var title = $('#input-note-title').val().trim();
        var category = $('#select-note-category').val().trim();
        if (category == 'notalloc'){
            category = undefined;
        }
        if (text != null && text != "") {
            saveNote(text, title, category);
        }
    }
});
//按键弹起解除锁
textarea.keyup(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (e.keyCode == 13 || ctrlKey) {
        isComboKeyDown = false;
    }
});

//放入回收站
function putToRecyclebin(id, infoEnabled = true) {
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //暂存
            var note_temp = note;
            //检查offset
            if (note.offset > 0) {
                path = note.rawtime + '.' + note.offset + '.json';
            } else {
                path = note.rawtime + '.json';
            }
            if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path)) {
                if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/')) {
                    fs.rename(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path, storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/' + path, function (err) {
                        if (err) {
                            displayInfobar('error', '放入回收站失败');
                            readNoteFiles();
                            throw (err);
                        } else {
                            //从数组里删除
                            deleteNoteFromArr(id);
                            //动画
                            $('#note_' + id).animateCss('fadeOutLeft faster', function () {
                                $('#note_' + id).parent().remove(); //动画结束后删除div
                                if (notes.length <= 0) {
                                    showNoteEmpty_Anim();
                                }
                            });
                            //send to main process
                            ipcRenderer.send('recycle-note', note_temp);
                            if (infoEnabled) {
                                displayInfobar('success', '已放入回收站');
                            }
                        }
                    });
                } else {
                    fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/recyclebin/');
                    fs.rename(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + path, storagePath + '/notes/recyclebin/' + path, function (err) {
                        if (err) {
                            if (infoEnabled) {
                                displayInfobar('error', '放入回收站失败');
                            }
                            readNoteFiles();
                            throw (err);
                        } else {
                            //从数组里删除
                            deleteNoteFromArr(id);
                            //动画
                            $('#note_' + id).animateCss('fadeOutLeft faster', function () {
                                $('#note_' + id).parent().remove(); //动画结束后删除div
                                if (notes.length <= 0) {
                                    showNoteEmpty_Anim();
                                }
                            });
                            //send to main process
                            ipcRenderer.send('recycle-note', note_temp);
                            if (infoEnabled) {
                                displayInfobar('success', '已放入回收站');
                            }
                        }
                    });
                }
            } else {
                if (infoEnabled) {
                    displayInfobar('error', '找不到文件，无法移入回收站');
                }
            }
            return false;
        } else {
            return true;
        }
    });
}

//放多个便签至回收站
function putNotesToRecyclebin(notes, callback) {
    if (Object.prototype.toString.call(notes) === '[object Array]') {
        if (notes.length > 0) {
            try {
                notes.forEach(noteid => {
                    putToRecyclebin(noteid, false);
                });
                if (typeof callback == 'function') {
                    callback(true);
                    return;
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
    if (typeof callback == 'function') {
        callback(false);
    }
}

//封装在函数中
function readNoteFiles() {
    //重新读取需要清空notes Array
    clearNoteArray();
    //判断是否存在notes文件夹，不存在代表没有笔记
    if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/')) {
        showNoteEmpty();
        isNotesEmpty = true;
        fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/');
    } else {
        fs.readdir(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/', function (err, fileArr) {
            if (err) {
                throw (err);
            }
            if (typeof (fileArr) == 'undefined') {
                showNoteEmpty();
                isNotesEmpty = true;
                return;
            }
            //执行初始化
            let countOffset = 0;
            fileArr.forEach(element => {
                if (!fs.statSync(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + element).isDirectory()) {
                    fs.readFile(storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + element, 'utf-8', function (err, data) {
                        if (err) {
                            countOffset++;
                            console.error(err);
                        }
                        var note_json = data;
                        if (typeof (note_json) != 'undefined' && note_json != null) {
                            note_json = JSON.parse(note_json);
                            addNoteToArray(note_json.id, note_json.time, note_json.rawtime, note_json.updatetime, note_json.updaterawtime, note_json.title, note_json.category, note_json.text, note_json.offset, note_json.timezone, note_json.forceTop);
                            if (notes.length + countOffset == fileArr.length) {
                                //结束文件遍历，渲染列表
                                refreshNoteList();
                                //显示列表
                                showNoteList();
                                //渲染便签数量
                                renderSystemCategoryCount();
                                renderCustomCategoryCount();
                            }
                        }
                    });
                } else {
                    countOffset++;
                }
            });
            if (notes.length == 0) {
                showNoteEmpty();
                isNotesEmpty = true;
            }
        });
    }
}

//保存note为json
function saveNote(notetext, notetitle, notecategory) {
    var alltime = time.getAllTime();
    //保存路径
    var path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.json';
    //计算文件的offset
    var offset = 0;
    if (fs.existsSync(path)) {
        offset++;
    }
    if (offset > 0) {
        path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        while (fs.existsSync(path)) {
            offset++;
            path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + alltime.rawTime + '.' + offset + '.json';
        }
    }
    //转换回车
    notetext = notetext.replace(/(\r\n)|(\n)|(\r)/g, '<br/>');
    //构造note
    var note = {
        id: notesid,
        time: alltime.currentTime,
        rawtime: alltime.rawTime,
        timezone: time.getTimeZone(),
        text: notetext,
        title: (typeof notetitle == 'undefined' ? undefined : notetitle.length > 0 ? notetitle : undefined),
        category: (typeof notecategory == 'undefined' ? undefined : notecategory.length > 0 ? notecategory : undefined),
        offset: offset,
        forceTop: false
    };
    var json = JSON.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
            displayInfobar('error', '保存便签时出现错误');
            return;
        } else {
            textarea.val('');
            displayInfobar('success', '成功保存便签');
        }
    });
    notesid++;
    saveNotesId();
    //把新增的note添加到array
    addNoteObjToArray(note);
    //如果是0到1则切换到列表页
    if (notes.length == 1) {
        showNoteList();
    }
    //分类的empty隐藏
    $('#note-empty-category').hide();
    //在顶部渲染Note
    renderNoteAtTop(note.id, note.rawtime, note.updaterawtime, note.title, note.category, note.text, note.forceTop);
    //绑定Note的点击事件
    bindNoteClickEvent();
}

//基于note obj保存便签
async function saveNoteByObj(note) {
    //保存路径
    var path = storagePath + (global.indebug ? '/devTemp' : '') + '/notes/' + note.rawtime + (typeof note.offset != undefined ? note.offset > 0 ? "." + note.offset : "" : "") + '.json';
    //计算文件的offset
    var json = JSON.stringify(note);
    fs.writeFile(path, json, 'utf-8', function (err, data) {
        if (err) {
            console.error(err);
        }
    });
}

//基于obj删除note
function deleteNoteByObj(note) {
    var note_path = storagePath + (global.indebug ? '/devTemp' : '') + "/notes/" + note.rawtime + (typeof note.offset != undefined ? note.offset > 0 ? "." + note.offset : "" : "") + ".json";
    if (fs.existsSync(note_path)) {
        fs.unlink(note_path, function (err) {
            if (err) {
                console.error(err);
            }
        });
    }
}

//保存ID
function saveNotesId() {
    var data = {
        id: notesid
    };
    storage.set('notesid' + (global.indebug ? '_dev' : ''), data);
}

