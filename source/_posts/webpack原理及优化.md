---
title: Webpack原理及优化
categories:
- 前端
tags:
- Webpack
---

Webpack 是一个黑盒，内部有其自我的一套运行流程，开发人员无需关注其内部做了什么，仅需通过 Webpack 所暴露出的配置字段进行配置，即可达到模块打包的目的。

# 原理

## 工作原理

#### 基本概念

+ Entry 入口， webpack 执行构建的第一步将从 Entry 开始，可抽象成输入。

+ Module 模块，在 webpack 里一切皆模块， 一个模块对应一个文件。 Webpack 会从配置的 Entry 开始，递归找出所有依赖的模块。

+ Chunk 代码块 Chunk 由多个模块组合而成，用于代码合并与分割。

+ Loader 模块转换器，用于将模块的原内容按照需求转换成新内容。

+ Plugin 扩展插件，在 Webpack 构建流程中的特定时机会广播对应的事件，插件可以监听这些事件的发生，在特定的时机做对应的事情

<!-- more -->

#### 构建流程

Webpack 的构建流程主要可以分为三大阶段

+ 初始化：启动构建，读取与合并配置参数，加载plugin，实例化 Compiler

+ 编译: 从 Entry 出发，针对每个 Module 串行调用对应的 Loader 去翻译文件的内容，再找到该 Module 依赖的 Module，递归地进行编译处理。

+ 输出：将编译后的 Module 组合成 Chunk ，将 Chunk 转换成文件，输出到文件系统中。

在每个大阶段中又会发生很多事件，Webpack 会将这些事件广播出来供 Plugin 使用。

###### 初始化

1. 初始化参数: 从配置文件和 shell 语句中读取与合并参数，得出最终的参数，在这个过程中还会执行配置文件中的插件实例化语句new Plugin()

2. 实例化Cpmpiler: 用上一步得到的参数初始化 Compiler 实例，Compiler 负责文件监听和启动编译。在 Compiler 实例中包含了完整的 Webpack 配置。 全局只有一个 Compiler 实例。

3. 加载插件：依次调用插件的 apply 方法，让插件可以监听后续的所有事件节点。同时向插件传入 Compiler 实例的应用，以方便插件通过 compiler 调用 webpack 提供的 API。

4. environment: 开始应用 Node.js 风格的文件系统到 compiler 对象， 以方便后续文件的寻找和读取。

5. entry-option: 读取配置的 Entry，为每个 Entry 实例化一个对应的 EntryPlugin，为后面该 Entry 的递归解析工作做准备。

6. after-plugins: 调用完所有内置的和配置的插件的 apply 方法。

7. after-resolvers: 根据配置初始化 resolver，resolver 负责在文件系统中寻找指定路径的文件。

###### 编译

1. run: 启动一次新的编译

2. watch-run: 和run类似，区别在于它是在监听模式下启动编译，在这个事件中可以获取是哪些文件发生了变化从而导致重新启动一次新的编译

3. compile: 该事件是为了告诉插件一次新的编译将要启动，同时会给插件带上 compiler 对象。

4. compilation: 当 Webpack 以开发模式运行时，每当检测到文件的变化，便有一次新的 Compilation 被创建， 一个 Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。Compilation 对象也提供了很多事件回调给插件进行扩展。

    1. build-module: 使用对应的 Loader 去转换一个模块

    2. normal-module-loader: 在用 Loader 转换完一个模块后，使用 acorn 解析转换后的内容，输出对应的抽象语法树（AST），以方便 Webpack 在后面对代码进行分析

    3. program：从配置的入口模块开始，分析其 AST，当遇到require等导入其他模块的语句时，便将其加入依赖的模块列表中，同时对新找出的依赖模块递归分析，最终弄清楚所有模块的依赖关系。

    4. seal: 所有模块及其依赖的模块都通过 Loader 转换完成，根据依赖关系开始生成 Chunk

5. make: 一个新的 Compilation 创建完毕，即将从 Entry 开始读取文件，根据文件的类型和配置的 Loader 对文件进行编译，编译完后再找出该文件依赖的文件，递归地编译和解析。

6. after-compile: 一次 Compilation 执行完成。

7. invalid: 当遇到文件不存在、文件编译错误等异常时会触发该事件，该事件不会导致 Webpack 退出。

###### 输出

1. should-emit: 所有需要输出的文件已经生成，询问插件有哪些文件需要输出，有哪些不需要输出。

2. emit: 确定好要输出哪些文件后，执行文件输出，可以在这里获取和修改输出的内容。

3. after-emit: 文件输出完毕

4. done: 如果在编译和输出的流程中遇到异常，导致 Webpack 退出，就会直接跳转到本步骤，插件可以在本事件中获取具体的错误原因。


# 优化

## 在开发环境中使用热模块替换 HMR 协助开发

## 生产环境下自动具备的优化

+ Tree Shaking

Tree Shaking 只支持 ES6 模块（也就是说只支持 import 语法），Tree Shaking 的作用是将引用模块中无关的内容给过滤掉。所以在导入模块时最好可以使用 `import { name } from "...."` 而不是 `import * as name from "..."`

Tree Shaking 会在生产环境中自动开启。

如若想在开发环境中也使用 Tree Shaking，可以在 optimization 中配置 `usedExports: true`

+ 压缩混淆JS代码

生产环境 Webpack 会默认压缩混淆 JS 代码。

## 可以在生产环境关闭 devtool

devtool 的作用是提供 sorceMap，如若不需要在生产环境进行调试，可以在生产环境关闭 devtool。开发环境中可以使用 `cheap-module-eval-source-map` 或者 `cheap-eval-source-map`。

> [devtool 几种配置的区别](https://www.webpackjs.com/configuration/devtool/)

## 开启 gzip 压缩

## Code Splitting

代码分割或者说懒加载，它的作用就是把 js 分割成几份，在用户需要加载时才加载，这样不用一次性加载所有 js。

相关配置：

```
optimization: {
    splitChunks: {
        chunks: "all"
    }
}
```

该配置项也可以结合 SplitChunksPlugin 使用。

## CSS代码分割

使用 MiniCssExtractPlugin 进行 CSS 代码分割

> [MiniCssExtractPlugin文档](https://webpack.js.org/plugins/mini-css-extract-plugin/)

## 压缩CSS代码

使用 OptimizeCssAssetsPlugin 进行 CSS 代码压缩(使用方法可以阅读[MiniCssExtractPlugin文档](https://webpack.js.org/plugins/mini-css-extract-plugin/))

如果使用了该插件压缩CSS代码后，需要自行使用 UglifyJS 进行压缩 JS 代码。

# 参考资料

+ [webpack4 的生产环境优化](https://segmentfault.com/a/1190000015836090)

+ [深入浅出Webpack](http://www.bookschina.com/7723448.htm)