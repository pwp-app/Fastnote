var fs = require('fs');

var storagePath = app.getPath('userData');

// 保存所有的notes
var notes = [];
var noteMap = {};

// execute
if (!settings){
  storage.get('settings' + (inDebug ? '_dev' : ''), function (err, data) {
    if (err) {
      //获取callback回传的json
      console.error(err);
    }
    settings = data;
    readNoteFiles();
  });
} else {
  readNoteFiles();
}

// 删除note
function deleteNote(id, infoEnabled = true) {
  notes.every(function (note, i) {
    if (note.id == id) {
      var path;
      //检查offset
      if (note.offset > 0) {
        path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
      } else {
        path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.json';
      }
      if (fs.existsSync(path)) {
        //删除文件
        fs.unlink(path, function (err) {
          if (err) {
            //文件删除失败
            if (infoEnabled) {
              displayInfobar('error', i18n[current_i18n]['file_delete_error']);
            }
            readNoteFiles();
            throw (err);
          } else {
            //删除成功
            deleteNoteFromArr(id, true);
            //动画
            $('#note_' + id).animateCss('fadeOutLeft faster', function () {
              $('#note_' + id).parent().remove(); //动画结束后删除div
              if (notes.length <= 0) {
                showNoteEmpty_Anim();
              }
            });
            if (infoEnabled) {
              displayInfobar('success', i18n[current_i18n]['delete_success']);
            }
          }
        });
      } else {
        if (infoEnabled) {
          displayInfobar('error', i18n[current_i18n]['delete_error_cantfindfile']);
        }
        readNoteFiles();
      }
      return false;
    } else {
      return true;
    }
  });
}

function deleteNoteByObj(note, infoEnabled = true) {
  let path;
  //检查offset
  if (note.offset > 0) {
    path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
  } else {
    path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.json';
  }
  if (fs.existsSync(path)) {
    //删除文件
    fs.unlink(path, function (err) {
      if (err) {
        //文件删除失败
        if (infoEnabled) {
          displayInfobar('error', i18n[current_i18n]['file_delete_error']);
        }
        readNoteFiles();
        throw (err);
      } else {
        //删除成功
        deleteNoteFromArr(note.id, true);
        //动画
        $('#note_' + note.id).animateCss('fadeOutLeft faster', function () {
          $('#note_' + note.id).parent().remove(); //动画结束后删除div
          if (notes.length <= 0) {
            showNoteEmpty_Anim();
          }
        });
        if (infoEnabled) {
          displayInfobar('success', i18n[current_i18n]['delete_success']);
        }
      }
    });
  } else {
    if (infoEnabled) {
      displayInfobar('error', i18n[current_i18n]['delete_error_cantfindfile']);
    }
  }
}

//多选删除Note
function deleteNotes(notes, callback) {
  if (Object.prototype.toString.call(notes) === '[object Array]') {
    if (notes.length) {
      try {
        notes.forEach(noteid => {
          deleteNote(noteid, false);
        });
        if (typeof callback === 'function') {
          callback(true);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  if (typeof callback === 'function') {
    callback(false);
  }
}

function restoreNote(id, infoEnabled = true) {
  notes.every(function (note, i) {
    if (note.id === id) {
      let path;
      // 检查offset
      if (note.offset > 0) {
        path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.' + note.offset + '.json';
      } else {
        path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + note.rawtime + '.json';
      }
      if (fs.existsSync(path)) {
        let newpath = path.replace('recyclebin/', '');
        fs.rename(path, newpath, function (err) {
          if (err) {
            if (infoEnabled) {
              displayInfobar('error', i18n[current_i18n].restore_error);
            }
            readNoteFiles();
            throw (err);
          } else {
            deleteNoteFromArr(id, true);
            //动画
            $('#note_' + id).animateCss('fadeOutLeft faster', function () {
              $('#note_' + id).parent().remove(); //动画结束后删除div
              if (notes.length <= 0) {
                showNoteEmpty_Anim();
              }
            });
            if (infoEnabled) {
              displayInfobar('success', i18n[current_i18n]['restore_success']);
            }
            ipcRenderer.send('restore-note', note);
          }
        });
      } else {
        if (infoEnabled) {
          displayInfobar('error', i18n[current_i18n].restore_cantfindfile);
        }
        readNoteFiles();
      }
      return false;
    } else {
      return true;
    }
  });
}

//多选回收便签
function restoreNotes(notes, callback) {
  if (Object.prototype.toString.call(notes) === '[object Array]') {
    if (notes.length > 0) {
      try {
        for (var i = 0; i < notes.length; i++) {
          restoreNote(notes[i], false);
        }
        if (typeof (callback) == 'function') {
          callback(true);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  if (typeof (callback == 'function')) {
    callback(false);
  }
}

//封装在函数中
function readNoteFiles() {
  //重新读取需要清空notes Array
  clearNoteArray();
  //判断是否存在notes文件夹，不存在代表没有笔记
  if (!fs.existsSync(storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/')) {
    showNoteEmpty();
    isNotesEmpty = true;
    fs.mkdirSync(storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/');
  } else {
    fs.readdir(storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/', function (err, fileArr) {
      if (err) {
        throw (err);
      }
      if (!fileArr) {
        showNoteEmpty();
        isNotesEmpty = true;
        return;
      }
      //目录是空的
      if (!fileArr[0]) {
        showNoteEmpty();
        isNotesEmpty = true;
      } else {
        //目录不是空的，代表有笔记，执行初始化
        let countOffset = 0;
        fileArr.forEach(element => {
          if (!fs.statSync(storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + element).isDirectory()) {
            fs.readFile(storagePath + (inDebug ? '/devTemp' : '') + '/notes/recyclebin/' + element, 'utf-8', function (err, data) {
              if (err) {
                countOffset++;
                console.error(err);
              }
              const note_json = data;
              if (note_json) {
                const note = JSON.parse(note_json);
                addNoteObjToArray(note, true);
                if (notes.length + countOffset == fileArr.length) {
                  // 等待页面DOM初始化
                  $(function () {
                    // 结束文件遍历，渲染列表
                    refreshNoteList();
                    // 显示列表
                    showNoteList();
                  });
                }
              }
            });
          } else {
            countOffset++;
          }
        });
      }
    });
  }
}