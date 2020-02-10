---
title: EasyMock 环境搭建
categories:
- 其他
tags:
- 笔记
---

## EasyMock 环境搭建

#### EasyMock 简述

EasyMock 是一个开源的数据模拟项目，可以模拟接口报文返回、报错等情景，适合有接口文档的前后端平行开发。

#### EasyMock 的环境依赖

+ node 8.11.0 以下版本
+ Mongodb
+ Redis

#### 安装 NVM

nvm 是 node 包管理工具，可以使用 nvm 命令对当前系统环境使用的 node 版本进行切换。

github 上有nvm for windows的安装包，下载地址：https://github.com/coreybutler/nvm-windows/releases

选择最新版本的 nvm-setup.zip 进行下载安装。

详细安装教程：https://www.cnblogs.com/Joe-and-Joan/p/10648566.html

###### 使用 NVM 安装 node 8.11.0环境

```
# 安装8.11.0
nvm install 8.11.0

# 使用8.11.0
nvm use 8.11.0

# 查看当前系统安装的node环境
nvm list
```

#### 安装并启动Mongodb

详细安装教程：https://www.jianshu.com/p/8e23ea81b7f5

#### 安装Redis

1. 下载最新版本zip后缀文件 https://github.com/MicrosoftArchive/redis/releases
2. 解压即可

#### 启动Redis

在Redis文件夹中找到 redis-server 文件，双击运行

如有开机自启需要，自行搜索其他网络文章

#### 下载EasyMock开源项目

github地址: https://github.com/easy-mock/easy-mock

git命令行下载：

```
git clone https://github.com/easy-mock/easy-mock.git
```

#### 安装依赖与运行

需要使用node 8.11.0环境进行安装与运行，请确保开启Mongodb和Redis服务

```
# 使用node 8.11.0环境
nvm use 8.11.0

# 进入到项目文件夹内
cd easy-mock

# 安装依赖
npm install

# 运行项目
npm run dev
```

#### EasyMock的配置

EasyMock运行在7300端口，如要修改端口，可在项目文件夹下：config/default.json 中进行配置

```
{
  "port": 7300, // 这里修改
  "host": "0.0.0.0",
  "pageSize": 30,
  "proxy": false,
  ... 
}
```

如若修改了Redis的端口号，也需要在 config/default.json 进行同步修改：

```
{
  "port": 7300,
  "host": "0.0.0.0",
  "pageSize": 30,
  "proxy": false,
  "db": "mongodb://localhost/easy-mock", // mongodb easy-mock数据库地址
  "unsplashClientId": "",
  "redis": {
    "keyPrefix": "[Easy Mock]",
    "port": 6379,     // redis的端口
    "host": "localhost",
    "password": "",   // 连接redis的密码，一般默认安装是没有密码的
    "db": 0
  },
  ...
}
```

#### EasyMock使用

EasyMock需要注册帐号使用，EasyMock具体的功能会在项目中有文档说明。