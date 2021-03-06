let win_recycle = null;

// const import
const {
    BrowserWindow
} = require('electron');

// ipc主进程
const ipc = require('electron').ipcMain;
const path = require('path');

const RecycleWindow = {
    create: () => {
        let conf = {
            width: 1200,
            height: 720,
            minWidth: 480,
            show: false,
            webPreferences: {
                enableRemoteModule: true,
                nodeIntegration: true
            }
        };
        // 标题栏的选用
        if (process.platform == 'darwin')
            conf.titleBarStyle = 'hiddenInset';
        else
            conf.frame = false;

        win_recycle = new BrowserWindow(conf);

        let viewpath;
        if (global.hotfix && global.hotfix.state !== 'close') {
            viewpath = global.hotfix.buildPath('recyclebin.html');
        } else {
            viewpath = path.resolve(__dirname, '../public/recyclebin.html');
        }
        win_recycle.loadFile(viewpath);

        ipc.on('recyclebin-window-ready', () => {
            win_recycle.show();
        });

        win_recycle.on('closed', () => {
            win_recycle = null;
        });

        // 锁屏
        win_recycle.on('minimize', () => {
            var windows = BrowserWindow.getAllWindows();
            for (let i = 0; i < windows.length; i++) {
                if (!windows[i].isMinimized()) {
                    return;
                }
            }
            for (let i = 0; i < windows.length; i++) {
                windows[i].webContents.send('enable-lockscreen-minimize');
            }
        });
        win_recycle.on('blur', () => {
            var windows = BrowserWindow.getAllWindows();
            if (BrowserWindow.getFocusedWindow() == null) {
                for (let i = 0; i < windows.length; i++) {
                    windows[i].webContents.send('enable-lockscreen-blur');
                }
            }
        });
    },
    reload: () => {
        if (win_recycle) {
            win_recycle.reload();
        }
    }
};

//ipc listen
ipc.on('recycle-note', function (sender, data) {
    if (win_recycle != null) {
        win_recycle.webContents.send('recycle-note', data); //pass recycled note when window is opened;
    }
});

ipc.on('reloadRecycleWindow', function (sender, data) {
    if (win_recycle != null) {
        win_recycle.reload();
    }
});

module.exports = RecycleWindow;