---
title: React 升级支持 Typescript
---

注意：本篇内容不完整，后续会不定时填充内容！

TypeScript 是 JavaScript 的超集，为泛类型的 JS 提供了类型支持。

对于 React 项目，想要改写为 TypeScript，获得 TS 提供的类型检查、代码提示等功能，是较为容易的。同时 React 文件和 TS 文件可以共存，经由 Webpack 打包后可以同时生效工作，提供了渐进的改写升级方式。

本文将介绍React 项目升级支持 TypeScript 的步骤。

## 安装依赖

为了支持 TS，你需要安装以下依赖：
<!-- more -->
+ TypeScript
+ ts-loader/awesome-typescript-loader
+ @types/react
+ @types/react-dom
+ 其他 @types 声明库

## tsconfig.json

在项目的根目录下，还应该存在一份 ts 的配置文件。
该配置文件规定了语法检查的一些配置项，完整的配置内容推荐你去阅读官方文档：

> https://www.typescriptlang.org/docs/handbook/compiler-options.html

你可以使用以下命令快速的生成一份预制的 tsconfig.json 文件。

```
tsc --init
```

对于React项目，其中较为重要的一个配置项是：

```
jsx："react"
```

## 使用 webpack 打包编译 TypeScript

#### 增加 ts 文件后缀的扩展

```
extensions: ['.js', '.jsx', '.ts', '.tsx', ....],
```

extensions 的作用是在 import 时，对于省略后缀的引用，使用以下扩展去匹配。

对于该语句 `import SetSomething from "./Components/SetSomething/main"`, 首先匹配的是 main.js, 其次是 main.jsx，知道匹配到存在该后缀的文件为止。

#### 增加 loader

```
rules: [
    {
        test: /\.tsx?$/,
        loader: "ts-loader"
    }
    // other loader...
]
```

#### awesome-typescript-loader & ts-loader

这两个 loader 都可以用做webpack打包时对 .ts(x) 文件的编译处理（将 .ts(x) 文件转为ES5或者更低版本的js代码）。
在 typescript 官网文档的例子中，使用了 awesome-typescript-loader；在 webpack 官网文档的例子中使用了 ts-loader。

##### 区别

网上并没有存在太多关于介绍两个loader区别的文章，最终在awesome-typescript-loader的介绍中找到了一些区别的介绍，原文如下：

awesome-typescript-loader  loader was created mostly to speed-up compilation in my own projects. Some of them are quite big and I wanted to have full control on how my files are compiled. There are two major points:

+ atl(awesome-typescript-loader) has first-class integration with Babel and enables caching possibilities. This can be useful for those who use Typescript with Babel. When useBabel and useCache flags are enabled, typescript's emit will be transpiled with Babel and cached. So next time if source file (+environment) has the same checksum we can totally skip typescript's and babel's transpiling. This significantly reduces build time in this scenario.

+ atl is able to fork type-checker and emitter to a separate process, which also speeds-up some development scenarios (e.g. react with react-hot-loader) So your webpack compilation will end earlier and you can explore compiled version in your browser while your files are typechecked.

总结来说：

+ awesome-typescript-loader 比 ts-loader 更重
+ awesome-typescript-loader 能在文件是怎么样编译的过程上完全的控制
+ awesome-typescript-loader 拥有缓存机制，在环境与文件一致的情况下，可以跳过typescript和babel的转换。
+ awesome-typescript-loader 将类型检查和更新分开，对热更新的开发环境更为友好，因为ts的编译过程会更早的结束并将结果展示出来。

## React 改写 TypeScript

#### 引用改写

由于 TS 声明文件中对 React 的各个组成部分进行了声明，并将这些部分 export，因此并不是原来暴露出一个整体的 React 类，所以要引用所有的组成部分。

```typescript
import * as React from "react";
```

#### State、Props改写
在 Typescript 中，使用接口来定义对象。因此在 Typescript 中使用 React 的 state、props 对象，也需要使用接口来预先定义这两个对象的组成与各个要素的类型。


```typescript
import * as React from "react";
import * as PropTypes from 'prop-types';

interface ListData {
  key: string,
  value: string
}
interface DropMenuState {
  downListShow: Boolean
}
export interface DropMenuProps {
  selectedKey: string,
  listData: ListData[]
}
  
export class DropMenu extends React.Component<DropMenuProps, DropMenuState> {
  static propTypes = {
    selectedKey: PropTypes.string
    // ...
  }
  constructor(props: DropMenuProps) {
    super(props);
    // ...
  }
}
```


#### 使用继承拓展Props
可以使用 extends 关键字对当前的 Props 进行定义拓展。

```typescript
// 父级接口定义了三个属性a/b/c
export interface BaseComponentProps {
  a: string;
  b: number;
  c: string[];
}

// 子级接口定义了其独有的1个属性d，此时子组件包含四个props
export interface SubComponentProps extends BaseComponentProps {
  d: number[];
}
```


#### Refs 改写

###### 回调函数形式改写

+ 定义一个内部变量
+ 通过 ref 属性设置回调函数
+ 实现回调函数赋值

```typescript
export class DropMenu extends React.Component<DropMenuProps, DropMenuState> {
  private menuNode: HTMLElement | null;
  render() {
    <div ref={this.getElement}></div>
  }
  getElement(node: HTMLElement | null): void => {
    this.menuNode = node;
  };
}
```


###### React.CreateRef()形式改写

+ 定义一个内部变量。
+ 在 constructor 中调用 React.CreateRef() 这个 API 初始化变量。
+ 在 render 中赋值给 ref 属性。

```typescript
export class DropMenu extends React.Component<DropMenuProps, DropMenuState> {
  private menuNode: React.RefObject<HTMLDIVElement>;
  constructor(props: DropMenuProps){
    super(props);
    this.menuNode = React.CreateRef();
  }
  render() {
    <div ref={this.menuNode}></div>
  }
}
```

#### 组件继承组件
可以使用泛型函数（组件）的方式来实现组件的继承。

###### 改写父组件

BaseSetSmartProps后指定了两个泛型P和S，分别接收传入的props和state。

父组件中需要定义该组件中使用的Props
```typescript
// 暴露出父级组件的props定义
export interface BaseSetSamrtProps {
    data: ISmartProjectItem;
    onSelected: (selectedData: ISmartProjectItem) => void;
}

class BaseSetSamrt<P extends BaseSetSamrtProps, S = {}> extends React.Component<
    P,
    S
> {
    constructor(props: P) {
        super(props);
        // ...
    }
    // ...
}
```

###### 改写子组件

子组件需要引入父组件的声明，并声明子组件自己使用的props并继承父组件的props。使用extends关键字继承父组件。
```typescript
// 导入
import BaseSetSmart, { BaseSetSamrtProps } from "./base-set-smart";

// 声明并导出子组件的props
export interface SetSmartAllProps extends BaseSetSamrtProps {}

// 子组件继承父组件
class SetSmartAll extends BaseSetSmart<SetSmartAllProps> {
  constructor(props: SetSmartAllProps) {
    super(props);
  }
}
```