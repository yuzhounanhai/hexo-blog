---
title: 自定义React渲染器
categories:
- 前端
tags:
- React
- react-dom
- react-reconciler
---

> 本文基于该文进行翻译、扩充： https://medium.com/@agent_hunt/hello-world-custom-react-renderer-9a95b7cd04bc

本文将实现一个基本的小型 Hello-World React 项目的渲染器，但这不是React渲染器真正的实现，并且和其有很大的不同。

### 创建一个新的 React 项目

首先，创建并运行一个新的 React 项目

```
create-react-app custom-render
cd custom-render
yarn start/npm start
```

### 添加一个小型的业务交互代码

其次，我们在新创建的项目中，增加一些业务交互代码，如点击事件、状态变更。这个简单交互的业务代码将成为一个测试例子来帮助我们了解渲染器接口的实际工作。

计数器是满足小型业务交互的场景，让我们添加一个简单的计数器，修改 `src/App.js` 的代码：

```javascript
import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [counter, setCounter] = useState(0);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p className="App-intro">
          <div className="button-container">
            <button className="decrement-button" onClick={() => setCounter(counter - 1)}>
              -
            </button>
            <span className="counter-text"> {counter} </span>
            <button className="increment-button" onClick={() => setCounter(counter + 1)}>
              +
            </button>
          </div>
        </p>
      </header>
    </div>
  );
}

export default App;
```

![示例效果](/images/20201009/reactapp.png)

<!-- more -->

### 替换React-Dom，尝试自己实现

1. 新建一个myCustomRender.js文件

2. 替换 `src/index.js` 中关于 ReactDOM 的渲染依赖及代码

```javascript
import React from 'react';
// import ReactDOM from 'react-dom';
import MyCustomRender from './myCustomRender';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );
    myCustomRender.render(
  <App />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
```

3. 安装 react-reconciler

```
yarn add react-reconciler/npm install react-reconciler --save
```

4. 在`myCustomRender.js`文件中使用`react-reconciler`

在`myCustomRender.js`中引入`react-reconciler`，并导出一个对象，这个对象中需包含一个`render`方法。

```javascript
import ReactReconciler from 'react-reconciler';

const hostConfig = {};
const ReactReconcilerInst = ReactReconciler(hostConfig);
export default {
  render: (reactElement, domElement, callback) => {
    // Create a root Container if it doesnt exist
    if (!domElement._rootContainer) {
      domElement._rootContainer = ReactReconcilerInst.createContainer(domElement, false);
    }

    // update the root Container
    return ReactReconcilerInst.updateContainer(reactElement, domElement._rootContainer, null, callback);
  }
};
```

5. 解决报错

保存之后，我们会得到一个报错：

![getRootHostContext is not a function](/images/20201009/error1.png)

缺少了`getRootHostContext`方法。`getRootHostContext`方法是一个被定义在`hostConfig`上的方法，这个方法的意图似乎是维护一些渲染器需要了解的必要的信息。

我们暂时不考虑这个函数的实现、传入传出，从目前我们可得知的，`getRootHostContext`是一个方法，那我们便在`hostConfig`中定义一个空函数。

```javascript
const hostConfig = {
  getRootHostContext: () => {}
};
```

在处理了这一个报错之后，我们会陆陆续续接收到几个函数不存在的报错，按照`getRootHostContext`做同样处理：

```javascript
const hostConfig = {
  getRootHostContext: () => {},
  getChildHostContext: () => {},
  shouldSetTextContent: () => {},
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  createTextInstance: () => {},
  createInstance: () => {},
};
```

6. appendAllChildren is not a function

appendAllChildren 并不是一个定义在hostConfig中的方法，而是一个在react-reconciler中声明创建的方法。

见react-reconciler源码：
```javascript
var appendAllChildren;

if (supportsMutation) {
  appendAllChildren = function() {}
} else if (supportsPersistence) {
  appendAllChildren = function() {}
} else {
}
```

从源码中不难得出，只有在 `supportsMutation` 或者 `supportsPersistence` 两个情况下才会初始化 `appendAllChildren` 方法。这是`react-reconciler`的两个模式。

我们先不管这两个模式分别是什么，这并不是本文的重点。我们先在hostConfig中设置 `supportsMutation` 为 `true`解决这个报错

```javascript
const hostConfig = {
  getRootHostContext: () => {},
  getChildHostContext: () => {},
  shouldSetTextContent: () => {},
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  createTextInstance: () => {},
  createInstance: () => {},
  supportsMutation: true,
};
```

接下来我们仍然会遇到 hostConfig 中缺少方法的问题，继续按照`getRootHostContext`的方式解决这些错误，最终我们会得到一个没有报错的空白页面。

完整的hostConfig就变成了下面这个样子：

```javascript
const hostConfig = {
  getRootHostContext: () => {},
  getChildHostContext: () => {},
  shouldSetTextContent: () => {},
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  createTextInstance: () => {},
  createInstance: () => {},
  supportsMutation: true,
  appendInitialChild: () => {},
  finalizeInitialChildren: () => {},
  appendChildToContainer: () => {},
};
```

### `hostConfig`中各方法的调用顺序、频率

在`hostConfig`的各个空函数方法中添加`console`语句，来获得这些方法在react-reconciler中的调用顺序、频率。

就像这样：

```javascript
const hostConfig = {
  getRootHostContext: () => {
    console.log('getRootHostContext');
  },
  getChildHostContext: () => {
    console.log('getChildHostContext');
  },
  shouldSetTextContent: () => {
    console.log('shouldSetTextContent');
  },
  prepareForCommit: () => {
    console.log('prepareForCommit');
  },
  resetAfterCommit: () => {
    console.log('resetAfterCommit');
  },
  createTextInstance: () => {
    console.log('createTextInstance');
  },
  createInstance: () => {
    console.log('createInstance');
  },
  supportsMutation: true,
  appendInitialChild: () => {
    console.log('appendInitialChild');
  },
  finalizeInitialChildren: () => {
    console.log('finalizeInitialChildren');
  },
  appendChildToContainer: () => {
    console.log('appendChildToContainer');
  },
};
```

输出结果：

```
myCustomRender.js:5 getRootHostContext
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:23 createInstance
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:20 createTextInstance
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild   * 3
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance   * 3
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild   * 3
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:8 getChildHostContext
myCustomRender.js:11 shouldSetTextContent
myCustomRender.js:20 createTextInstance
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild   * 3
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild   * 4
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:23 createInstance
myCustomRender.js:27 appendInitialChild
myCustomRender.js:30 finalizeInitialChildren
myCustomRender.js:14 prepareForCommit
myCustomRender.js:33 appendChildToContainer
myCustomRender.js:17 resetAfterCommit
```

### 结合源码传参及命名，尝试用最简单的逻辑实现函数内容

```javascript
const rootHostContext = {};
const childHostContext = {};

const hostConfig = {
  // 将维护的rootHostContext返回
  getRootHostContext: () => {
    return rootHostContext
  },
  // 将维护的childHostContext返回
  getChildHostContext: () => {
    return childHostContext;
  },
  // 是否需要设置node.textContent，也就是当textContent为文本（即字符串或数字时）
  shouldSetTextContent: (type, props) => {
    return typeof props.children === 'string' || typeof props.children === 'number';
  },
  prepareForCommit: (rootContainerInfo) => {
    console.log('prepareForCommit');
  },
  resetAfterCommit: (rootContainerInfo) => {
    console.log('resetAfterCommit');
  },
  // 创建一个Text实例，即创建真实的Text DOM节点
  createTextInstance: (newText, rootContainerInstance, currentHostContext, workInProgress) => {
    return document.createTextNode(newText);
  },
  // 创建一个实例，方法接收了type，newProps
  // 即创建了一个类型为type的DOM节点，遍历newProps，将一些特殊属性剔出做额外处理。
  createInstance: (type, newProps, rootContainerInstance, currentHostContext, workInProgress) => {
    const domElement = document.createElement(type);
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName];
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          domElement.textContent = propValue;
        }
      } else if (propName === 'onClick') {
        domElement.addEventListener('click', propValue);
      } else if (propName === 'className') {
        domElement.setAttribute('class', propValue);
      } else {
        const propValue = newProps[propName];
        domElement.setAttribute(propName, propValue);
      }
    });
    return domElement;
  },
  supportsMutation: true,
  // 附加初始状态的子节点，那就当appendChild处理
  appendInitialChild: (parent, child) => {
    parent.appendChild(child);
  },
  finalizeInitialChildren: (newInstance, type, newProps, rootContainerInstance, currentHostContext) => {
    console.log('finalizeInitialChildren');
  },
  // 附加子节点给容器，就当appendChild处理
  appendChildToContainer: (parent, child) => {
    parent.appendChild(child);
  },
};
```

这个时候，我们已经可以看到界面的呈现

![自定义渲染出来的页面](/images/20201009/customRenderApp.png)

只不过当我们点击按钮时，仍然会产生报错，提示我们仍然缺少了一些方法。继续一个一个的补足

```javascript
  // 从容器元素中移除子节点 
  removeChildFromContainer: (parent, child) => {
    parent.removeChild(child);
  },
  // var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); // TODO: Type this specific to this type of component.

  // workInProgress.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
  // // is a new ref we mark this as an update. All the work is done in commitWork.

  // if (updatePayload) {
  //   markUpdate(workInProgress);
  // }
  // 源码之中,prepareUpdate返回一个布尔值,当返回为true时,将会markUpdate.
  // 那么可以猜测这是一个决定是否更新的函数,我们为了方便,无论何时都更新
  prepareUpdate: (instance, type, oldProps, newProps, rootContainerInstance, currentHostContext) => {
    return true;
  },
  // 提交更新,将所有的newProps覆盖
  commitUpdate: (instance, updatePayload, type, oldProps, newProps, finishedWork) => {
    console.log(oldProps, newProps);
    Object.keys(newProps).forEach(propName => {
      const propValue = newProps[propName];
      if (propName === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          instance.textContent = propValue;
        }
      } else if (propName === 'onClick') {
        const oldValue = oldProps[propName];
        instance.removeEventListener('click', oldValue);
        instance.addEventListener('click', propValue);
      } else if (propName === 'className') {
        instance.setAttribute('class', propValue);
      } else {
        const propValue = newProps[propName];
        instance.setAttribute(propName, propValue);
      }
    });
  },
  // 提交text节点的更新,从参数中可得即更新textContent
  commitTextUpdate: (textInstance, oldText, newText) => {
    textInstance.textContent = newText;
  },
```

当在`hostConfig`中补充以上的内容后, 已经可以响应点击操作.

至此已经简易的渲染器便完成了.

### hostConfig 中各方法的分类

hostConfig中的方法, 具有较小的细粒度. 它们可以被归为下面的几类:

+ 创建操作型方法

  - `createInstance`: 这是`react-reconciler`要根据目标创建UI元素实例的地方. 由于我们最终的目的是DOM实例, 所以我们将会调用 `document.createElement` 并传入 `type` 作为参数, 比如 `div` | `img` 等.

  - `createTextInstance`: 这是用以创建一个纯文本节点的方法.

+ UI树操作

  - `appendInitialChild`: `domElement.appendChild`的map映射, 将在初始化时被调用

  - `appendChild`: `domElement.appendChild`的map映射, 它类似于`appendInitialChild`, 但不同的是它用于后续的树操作

  - `appendChildToContainer`: `domElement.appendChild`的map映射

  - `commitTextUpdate`: 对于纯文本节点而言, 是 `Node.textContent` 的map映射

  - `removeChildFromContainer`: 从容器中移除节点

+ props更改操作

  - `finalizeInitialChildren`: 从字面翻译并结合实际的react-reconciler中的使用的位置来看, 与组件渲染有关. 由于本文并不涉及组件渲染, 因此该方法留空.

  - `prepareUpdate`: 从源码处分析, 这是需要我们比较新旧props, 来决定是否触发更新的地方.

  - `commitUpdate`: 此函数用于随后从newProps值更新domElement属性。

+ 其他

  - `getRootHostContext`

  - `getChildHostContext`

  - `shouldSetTextContent`: 该方法可以被归类为utils, 用以判断是否需要设置Node.textContent.
  
  - `prepareForCommit`

  - `resetAfterCommit`