# Fastnote

## 概述

Fastnote现阶段是一个基于Electron开发的桌面速记工具，未来将加入云同步、分享等功能，且计划开发其他平台的客户端。

该工具的特点在于通过一个“类聊天”的交互方式实现了高效的便签创建，让你从此远离在桌面上频繁新建txt的日子。

## 使用方法

### 基于源码使用

使用命令提示符进入项目目录，用以下命令启动应用：

```
electron .
```

如需开启开发模式，请修改main.js的如下行：

```javascript
global.indebug = true;  //将false改为true
```

### 使用稳定版（推荐）

前往[项目主页](https://note.pwp.app)下载安装，应用支持自动更新。

## 项目目录结构

app     ->  应用源码
    app/tools   ->  工具脚本
assets  ->  图片素材
src     ->  页面源码
    src/less    ->  页面样式
    src/pages   ->  页面文件
    src/scripts ->  页面脚本

## 开发命令

打包整个应用

```
npm run build
```

生成文件至public

```
gulp build
gulp clean-build    //清理环境后生成
```

监控文件改动实时生成（页面部分）

```
gulp watch
```

## 当前开发计划

- [x] 便签置顶
- [x] 导出备份文件
- [x] 导入备份文件
- [ ] 匿名分享
- [ ] 支持部分的Markdown（便签标题、分割线、markdown式链接）
- [x] 预发布通道
- [x] 菜单全部模板化
- [ ] 分栏编辑模式
- [ ] 多种排序选项