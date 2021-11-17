---
title: JS沙箱的基本实现
categories:
- 前端
tags:
- 微前端
- qiankun
- js
isLock: true
---

微前端中，为了保证应用之间js环境（主要是window全局变量）的独立，需要使用JS沙箱来对各应用的执行环境进行隔离。

qiankun中使用了两种方案来实现这一隔离，分别是：

+ 快照沙箱
+ 代理沙箱Proxy

对于支持Proxy的浏览器使用代理沙箱，不支持的浏览器降级使用快照沙箱。

两种沙箱均具备相同的使用方式：卸载应用时，使沙箱失活；挂载应用时，使沙箱激活；

即对于应用A，应用B，都会去创建应用A\B独立的沙箱。初始化时（若需挂载A应用），则使沙箱A激活；从A应用切换至B应用时，沙箱A失活，沙箱B激活。

<!-- more -->

### 快照沙箱

快照沙箱的基本思路是记录差异并存储。

我们以两个应用为例，按照上文对于沙箱基本工作过程的阐述，可以分析得到以下信息：

+ 目前我们有全局上下文window（状态1），沙箱A，沙箱B；
+ 当挂载A应用时，沙箱A**激活**
+ A应用可能会对全局上下文window进行更改，例如增添自己的属性window.a，此时window的内容发生了改变（状态2）
+ 当要从A应用切换到B应用时，沙箱A先**失活**，失活即令window的状态从状态2重置为状态1
+ 接下来因为要切换至B应用，沙箱B需要**激活**
+ B应用亦可对window进行更改，例如增添自己的属性window.b，此时window的内容也发生了变化（状态3）
+ B切换A，沙箱B**失活**，状态重置为状态1，沙箱A**激活**，状态重置为状态2

不难发现，沙箱激活前，当前window对象一定为纯粹的window对象；沙箱激活后至沙箱失活前，当前的window对象一定为当前应用使用的window（即纯粹的window对象+当前应用对window对象做出的修改）

因此沙箱中必然存储着纯粹window对象与应用window对象之间的差异，我们也可以得到两个方法可以获得的内容和职责。

+ 激活方法：可以获得纯粹的window对象的属性和方法，需要使纯粹window对象变为当前应用的window对象
+ 失活方法：可以获得当前应用的window对象的属性和方法，需要使当前window对象变为纯粹的window对象

也就是说，激活方法中程序读取到的window对象，即为纯粹的window对象，我们需要对这个window对象附加/修改/移除，使得window对象变为当前应用使用的window对象；失活方法中程序代码中获取到的window对象，就是应用本身的window对象，我们需要对这个window对象附加/修改/移除，使得window对象变为纯粹的window对象

搞清楚后，我们就可以得到以下代码

```javascript
function active() {
  // 这里读取的window 是纯粹的window对象
  const appWindow = toAppWindow(window);
  window = appWindow;
}

function inActive() {
  // 这里读取的window 是当前应用的window对象
  const originalWindow = toOriginalWindow(window);
  window = originalWindow;
}
```

接下来，我们的问题就转变为了，如何去设计存储差异，并将差异重置、恢复。

快照沙箱即对两个状态的window对象进行一次快照，然后比对两次快照的不同，存储不同内容和原始内容，达到差异重置的目的。

可以设计为以下内容：

```javascript
const originalSnapshot = {};
const modifyPropsMap = {};

function active() {
  // 记录当前的window对象的样子 存放在originalSnapshot上
  // 根据差异（modifyPropsMap）去修改window对象
}

function inActive() {
  // 遍历当前window对象，并将这个window对象的属性内容和originalSnapshot存储的进行比对
  // 如若一致 忽略
  // 如若不一致 将属性-值记录至modifyPropsMap中，然后将该属性的值还原为originalSnapshot记录的值
}
```

你可以根据以上阐述先进行自我代码实现。

实现后的代码如下：

```javascript
const originalSnapshot = {};
const modifyPropsMap = {};

function active() {
  // 记录当前的window对象的样子 存放在originalSnapshot上
  for (const prop in window) {
    // for in 会遍历到继承的属性，因此需要增设一个判断，详见mdn：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...in
    if (window.hasOwnProperty(prop)) {
      originalSnapshot[prop] = window[prop];
    }
  }
  // 根据差异（modifyPropsMap）去修改window对象
  Object.keys(modifyPropsMap).forEach(prop => {
    window[prop] = modifyPropsMap[prop];
  });
}

function inActive() {
  // 遍历当前window对象
  for (const prop in window) {
    if (window.hasOwnProperty(prop)) {
      // 并将这个window对象的属性内容和originalSnapshot存储的进行比对
      // 如若一致 忽略
      // 如若不一致
      if (window[prop] !== originalSnapshot[prop]) {
        // 将属性-值记录至modifyPropsMap中
        modifyPropsMap[prop] = window[prop];
        // 然后将该属性的值还原为originalSnapshot记录的值
        window[prop] = originalSnapshot[prop];
      }
    }
  }
}
```

至此，我们就实现了这一快照沙箱，只需要针对这一段代码进行封装，封装为一个class，以便后续不同应用创建不同的沙箱（new方法创建）

```javascript
class SnapshotSandbox {
  constructor() {
    this.proxy = window;
    this.originalSnapshot = {};
    this.modifyPropsMap = {};
  }

  active() {
    for (const prop in window) {
      if (window.hasOwnProperty(prop)) {
        this.originalSnapshot[prop] = window[prop];
      }
    }
    Object.keys(this.modifyPropsMap).forEach(prop => {
      window[prop] = this.modifyPropsMap[prop];
    });
  }

  inActive() {
    for (const prop in window) {
      if (window.hasOwnProperty(prop)) {
        if (window[prop] !== this.originalSnapshot[prop]) {
          this.modifyPropsMap[prop] = window[prop];
          window[prop] = this.originalSnapshot[prop];
        }
      }
    }
  }
}
```

简单模拟使用：

```javascript
function excuteAppA() {
  window.a = 'a';
  window.aa = 'aa';
}
function excuteAppB() {
  window.b = 'b';
  window.bb = 'bb';
}
function showConsole() {
  console.log(window.begin, window.a, window.aa, window.b, window.bb);
}
// begin 在挂载应用之前，可能会有其他的库在window上挂载一些内容
window.begin = 'some value';
// 创建A B应用的沙箱
const sandboxA = new SnapshotSandbox();
const sandboxB = new SnapshotSandbox();

// 看看当前window的结果
showConsole();
// 假设初始化时挂载A应用
sandboxA.active();
// 挂载完毕后，A应用可能会执行它自己的逻辑
excuteAppA();
// 看看当前window的结果
showConsole();
// 从应用A切换至B 经历A失活 B激活
sandboxA.inActive();
sandboxB.active();
// 看看当前window的结果
showConsole();
// 挂载完毕后，B应用也可能会执行它自己的逻辑
excuteAppB();
// 看看当前window的结果
showConsole();
// 从应用B切换至A 经历B失活 A激活
sandboxB.inActive();
sandboxA.active();
// 看看当前window的结果
showConsole();

/*
some value undefined undefined undefined undefined
some value a aa undefined undefined
some value undefined undefined undefined undefined
some value undefined undefined b bb
some value a aa undefined undefined
*/
```

### 代理沙箱

代理沙箱运用了proxy，保证了window对象的纯净，不被污染。

> proxy mdn https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy

代理沙箱的基本思路是：设置操作都作用于代理对象上，读取操作都从代理对象上读取，如若代理对象上无此对象，则从原生window上读取。

最基础的实现如下:

```javascript
const originalWindow = window;
const fakeWindow = {};
const proxyWindow = new Proxy(fakeWindow, {
  get(target, prop) {
    if (target.hasOwnProperty(prop)) {
      return target[prop];
    }
    return originalWindow[prop];
  },
  set(target, prop, receiver) {
    target[prop] = receiver;
    return true;
  }
});
```

我们按照快照沙箱一样，进行封装

```javascript
class ProxySandbox {
  constructor() {
    const originalWindow = window;
    const fakeWindow = {};
    const proxyWindow = new Proxy(fakeWindow, {
      get(target, prop) {
        if (target.hasOwnProperty(prop)) {
          return target[prop];
        }
        return originalWindow[prop];
      },
      set(target, prop, receiver) {
        target[prop] = receiver;
        return true;
      }
    });
    this.proxy = proxyWindow;
  }

  active() {}

  inActive() {}
}
```

以上便是简略版本的代理沙箱的实现，要达到生产可用的状态，还需要针对各种特性增加亿点点的细节处理，可以阅读qiankun中代理沙箱的实现了解更多细节：

> https://github.com/umijs/qiankun/blob/61eeacbbee4e9f185f4f92759f2cadc7015392ce/src/sandbox/proxySandbox.ts

注：这里并没有去实现 active inActive 方法，是因为每个 ProxySandbox 都拥有其独立的代理对象，并不会污染真正的window对象，而快照沙箱会污染真正的window对象，所以需要在激活失活时去进行恢复/重置操作。因此代理沙箱的 active inActive 并没有在代理沙箱的核心实现上出力，这两个方法主要可以做的是标识了这一沙箱是否处于运行状态中，便于沙箱的总调度中心通过遍历来获取当前正在生效的沙箱。

```javascript
class ProxySandbox {
  // ... 其他代码省略

  active() {
    this.sandboxRunning = true;
  }

  inActive() {
    this.sandboxRunning = false;
  }
}
```

##### 应用执行在沙箱内

创建出沙箱后，执行可能并不如同我们在快照沙箱中写的那样，而是：应用运行在一个沙箱构建出的一个域内，切换应用以及沙箱的激活失活操作则运行在域外。

这个域其实就是一个函数作用域，在这个函数作用域中，会有一个与window同名的入参，用以屏蔽全局作用域上的window对象。

因此运行情况类似于：

```javascript
const sandboxA = new SnapshotSandbox();
const sandboxB = new SnapshotSandbox();

sandboxA.active();

// ...

((window) => {
  window.a = 'a';
  window.aa = 'aa';
})(sandboxA.proxy);

sandboxA.inActive();
sandboxB.active();

// ...

((window) => {
  window.b = 'b';
  window.bb = 'bb';
})(sandboxB.proxy);
```

其中的应用程序执行在沙箱，就体现在这段代码中：

```javascript
((window) => {
  window.a = 'a';
  window.aa = 'aa';
})(sandboxA.proxy);
```