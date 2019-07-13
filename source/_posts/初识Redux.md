---
title: 初识Redux
---

## Redux定义

> Redux is a predictable state container for JavaScript apps. 
> 对于 JavaScript 应用而言， Redux 是一个可预测状态的“容器”.

上面的定义，是 Redux 官方给出的，你可以片面的将 Redux 理解为一个存储状态的容器（但并不仅仅是容器），但请不要忽略上面定义中的关键词：可预测状态。

> Redux 是库结合模式

Redux 是一个库，这个库体积很小，并且库内的实现十分优雅。但 Redux 与传统的库不同，它在提供方法使用的同时，限制了一部分内容，在这一层面上，它又像是一种设计模式。因此，不妨将 Redux 理解成一个严格规定了使用模式的库。

<!-- more -->

## Redux 设计哲学理念

前文说道，Redux 限制了库使用者的行为，要求使用者以 Redux 的设计哲学进行使用，现在我们就来了解一下这些设计哲学。

#### Single source of truth 数据来源单一

无论如何，都使用一个 JavaScript 对象来描述状态机内的全部状态。也就是说，页面所记录的所有状态，都被表述为一个 JavaScript 对象。这个 JavaScript 对象存储在 store 中，这个 store 一定是 **唯一** 的。

这个哲学理念使我们的关注点变得十分简单和直接，因为一个数据来源，那么会使关注点转移到数据，而读取更改数据，只需要对这个存储着状态的 store 进行操作即可。

而在 Redux 中，读取状态也十分的简单，你可以通过 `getState()` 方法直接拿到 Redux 中存储的所有数据。

```
let state = store.getState();
```

#### State is read-only 状态是只读的

我们通过 `getState()` 方法读取到的 State 是只读的，因此下面的写法是不被允许的：

```
// 注意：这个写法是不被 redux 允许的
let state = store.getState();
state.foo = 'bar';
```

因此对于读取到的状态，我们不能做出修改，读取要有读取的样子，只能做读取的事情，至于修改，那就要引出第三个哲学理念。

#### Changes are made with pure functions called reducer. 

数据的改变需要通过一个名叫 reducer 的纯函数进行实现。

reducer 是这类纯函数的名称，也就是说这类改变 redux 内部状态数据的纯函数，都被统称为 reducer。

reducer 函数会接受一个 action（还有当前页面数据状态），并根据这个 action 来执行页面状态树的改变。

经过 reducer 函数的操作后，函数会返回一个 **新的JavaScript 对象**。

通过上面的简要分析，我们已经可以明白这个 reducer 函数的输入与输出：

```
(previousState, action) => newState
```

<br/>

> reducer 名称的由来
>
> 在 Redux 源码的 github 仓库中，有这样一段解释：
> “It’s called a reducer because it’s the type of function you would pass to Array.prototype.
reduce( reducer, ?initialValue ).” 
> JavaScript 数组的 reduce 方法是 种运算合成，它通过遍历、变形、累积，将数组的所有成员“累积”为一个值。
> 这样的过程很符合 reducer 函数的实现。

<br/>

> 纯函数的定义
> 
> 纯函数代表这样一类函数: 只根据输入参数，返回输出结果。它的准确定义有两个方面：
> + 对于指定输入，返回指定结果
> + 不存在任何副作用
> 
> 纯函数中不存在副作用是指 不包含 以下内容：
> 1. 调用系统 I/O 的 api、`Date.now()` 或者 `Math.random()` 等方法。
> 2. 发送网络请求。
> 3. 在函数体内修改外部变量的值。
> 4. 使用 `console.log()` 输出信息。
> 5. 内部调用了其他存在副作用的函数。

## Redux 中的概念

Redux 中存在以下概念：

+ store
+ action
+ reducer
+ dispatch

在这个部分，我将简要的介绍一下这些概念在 Redux 中扮演的角色：

+ store 是一个容器。
+ action 是“命令文件”，是“一纸文书”。
+ reducer 是“执行部门”，它们接受“命令文件”，并根据“命令文件”执行最终的更改。
+ dispatch 是“通知员”：通知“执行部门”，并传递“命令文件”。

也许你看这些内容仍会感觉迷惑，不着急，下面我将详细说说这些理解。

#### store 是一个容器

Redux 是可预测状态的容器，这个容器就是 store。

事实上， store 就是一个 JavaScript 对象 里面包含了 dispatch 及获取页面状态数据树的方法等。

```
store = {
    dispatch,
    getState ,
    subscribe,
    replaceReducer 
}
```

#### action 是“命令文件”，是“一纸文书”

action 翻译过来是动作，但在 Redux 中，它不是一个动作，它是描述这个动作的一个对象。

它的样子可能是这样的：

```
{
  type: 'ADD_NOTE',
  text: 'Write Something.'
}
```

因此，action 可以抽象的理解为“命令文件”，描述了要干什么，具体内容是什么。

譬如上面的action，它就代表了这是一个“增加一则笔记”的操作（要干什么知道了），增加这则笔记的内容是“Write Something.”（具体内容知道了）。

#### reducer 是“执行部门”，它们接受“命令文件”，并根据“命令文件”执行最终的更改。

这里的意思就是字面意思，真正引发 store 中数据的更改的是 reducer。

reducer 只认“命令文件”，也就是 action。它只根据 action 的内容做出数据的更改。仍然以上面的 action 为例，reducer则会在 store 中增加一个内容为“Write Something”的 note 数据。

#### dispatch 是“通知员”：通知“执行部门”，并传递“命令文件”。

dispatch 是一个方法，它的定义如下：

```
store.dispatch(action);
```

执行 dispatch 方法，redux 会将这个 action 传递到 reducer 中，所以 dispatch 也可以理解为是触发实际响应的一个操作。


## 小结

+ Redux 是一个可预测状态的“容器”，是一个严格约束了使用模式的库。

+ Redux 的三个原则是:
    + 单一数据源
    + State是只读的
    + 使用纯函数来执行修改

+ Redux 的四个概念:
    + store 是一个容器，容器的内部除了存储状态外，还包含了一系列的方法。
    + action 是描述动作的对象，可以理解为“命令文件”。
    + reducer 真正的引发了 store 存储的状态的改变，可以理解为“执行部门”，它们只根据 action 来做出数据更改。
    + dispatch 是 store 中的一个方法，该方法接受 action，调用该方法后，redux 会将 action 传递给 reducer 进行下一步的操作。

## 参考资料

+ 《React状态管理与同构实战》
+ [Redux 中文文档](https://www.redux.org.cn/)