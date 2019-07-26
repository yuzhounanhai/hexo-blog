---
title: 简单实现虚拟DOM与Diff算法
categories:
- 前端
tags:
- React
- JS
- 原理
---

## 什么是虚拟Dom

虚拟 Dom（virtual Dom）正如其名，它并不是真正的 Dom 对象，但可以根据虚拟 Dom 来转换为真正的 Dom 对象。

虚拟 Dom 其实是一个 JavaScript 对象，对于下面所示的 Dom 结构：

```html
<ul class="lists">
    <li>1</li>
    <li class="item">2</li>
    <li>3</li>
</ul>
```

该 Dom 结构所对应的 JavaScript 对象可以是这样的：

<!-- more -->

```javascript
const virtualDom = {
    type: 'ul'
    props: {
        class: 'lists'
    },
    children: [
        {
            type: 'li'
            props: {},
            children: ['1']
        },
        {
            type: 'li'
            props: { class: 'item' },
            children: ['2']
        },
        {
            type: 'li'
            props: {},
            children: ['3']
        }
    ]
}
```

这种能够表示 Dom 的 JavaScript 对象，就是虚拟 Dom。

#### 虚拟 Dom -> 真实 Dom

在创建新元素时，React 会首先创建出虚拟 Dom，然后根据虚拟 Dom 的表示，经过 render 方法转换为真实的 Dom。

而后续有关界面上的交互，也是作用在虚拟 Dom 上，触发虚拟 Dom 的更新，从而引起真实 Dom 的更新。

![虚拟Dom和真实Dom的交互](/images/20190726/virtual_dom_and_dom.png)

## 虚拟 Dom 的实现

我们在书写 React 组件时可以使用两种语法：

+ JSX

+ React.createElement

JSX 是 React 提供的一个语法糖，借助 Babel 工具，使开发者可以使用更方便的语法形式来书写，实际上这两种方式是等价的。换句话说，JSX 在经过 Babel 的转换后，会使用 `React.createElement()` 这一方法。

#### 简单实现 React.createElement 方法

+ createElement(type, config, children): Element;

该方法主要做的就是创建一个对象，来描述 Dom 信息，可以创建一个构造函数来保存，并通过 new 关键字去实例化。

```javascript
function Element(type, config, children) {
    this.type = type;
    this.props = config;
    this.children = children;
}

function createElement(type, config, children) {
    return new Element(type, config, children);
}
```
使用时需要调用 `createElement` 方法：

```javascript
let virtualDom1 = createElement("ul", { class: "lists" }, [
    createElement("li", {}, ["1"]),
    createElement("li", { class: "item" }, ["2"]),
    createElement("li", {}, ["3"]),
]);

console.log(virtualDom1);
```

#### 实现render方法

虚拟 Dom 需要通过一个 render 方法，将虚拟 Dom 对象转换为真实 Dom。

+ render(eleObj);

```javascript
function setAttr(node, key, value) {
    switch(key) {
        case "value":
            if (node.tagName.toUpperCase === 'INPUT' || node.tagName.toUpperCase === "TEXTAREA") {
                node.value = value;
            } else {
                node.setAttribute(key, value);
            }
            break;
        case "style":
            node.style.cssText = value;
            break;
        default:
            node.setAttribute(key, value);
            break;
    }
}
function render(eleObj) {
    // 创建Element
    let el = document.createElement(eleObj.type);

    // 遍历属性并设置
    for (let key in eleObj.props) {
        setAttr(el, key, eleObj.props[key]);
    }

    // 遍历孩子节点，并创建（如果是Element构造函数，则递归调用render方法，否则创建一个文本节点）
    eleObj.children.forEach(child => {
        if (child instanceof Element) {
            child = render(child);
        } else {
            child = document.createTextNode(child);
        }
        el.appendChild(child);
    });

    return el;
}
```
调用

```javascript
let virtualDom1 = createElement("ul", { class: "lists" }, [
    createElement("li", {}, ["1"]),
    createElement("li", { class: "item" }, ["2"]),
    createElement("li", { style: "color: red;" }, ["3"]),
]);

let dom = render(virtualDom1);

console.log(dom);
```

![打印虚拟Dom和真实Dom](/images/20190726/virtual_dom_obj_and_dom.png)

要令 dom 显示在页面上，那么还需要最后做一次append操作：

```javascript
// 这里只是最简单的插入到了body中，实际上还存在通过id选择root节点，再将dom插入到root节点中
document.body.appendChild(dom);
```

以上我们就简单的实现了一个虚拟Dom。

> 简单实现中并没有包括 ref、key 等内容，如果你想了解更多，推荐阅读源码解析相关文章，这边推荐一篇文章：
>
> [【React深入】深入分析虚拟DOM的渲染原理和特性](https://juejin.im/post/5cb66fdaf265da0384128445)

## patch 补丁

React 通过 patch 补丁的形式来更新现有的 Dom，所谓的 patch 补丁，其实也是一个对象，这个对象描述了虚拟 Dom 树需要做出怎么样的修改。它的形式类似于：`{ type: 'REPLACE', node: newNode }`。

上面那种形式的补丁，告诉我们此处需要替换内容。那么根据这个补丁，所对应的依旧是Dom操作。

#### patch 从何而来？

patch 补丁来源于 Dom Diff，Diff 则发生在新旧的虚拟 Dom 树上。

通过对比新旧虚拟 Dom 树，计算出差异，产生 patch 补丁，这些补丁也就是如果将旧的 Dom 树更新为新的 Dom 树的所需要做出的 Dom 操作。

#### 使用虚拟 Dom 会更快吗？

使用虚拟 Dom 不一定会变得更快。虚拟 Dom 是 Dom 的 JavaScript 表示，在事件发生时，通过对比新旧虚拟 Dom 得出更新（通过 Diff 算法获得 patch 补丁），这是一系列转换、分析、计算的过程。

对于一个很简单的场景（点击按钮，页面显示的数字增加），直接操作 dom 将会是更快的，因为在一系列的分析计算后，所产生的 patch 补丁也将是这样的 dom 操作。尽管这个过程可能并不久，但依旧经历了额外的分析计算过程。

对于复杂场景，虚拟 Dom 会是更快的，页面性能所最重要的地方也就是重排、重绘，频繁的 Dom 操作所带来的页面开销将是巨大的。在经过 Diff 的分析计算后，产生 patch 补丁，将会简化 Dom 操作（可能并不是最优的），极大的减少不必要的、重复的 Dom 操作。

## Diff

#### 先序深度优先遍历

Diff 采用先序深度优先遍历来观察差异，所谓先序深度优先，也就是先遍历根节点，其次是子节点（对于二叉树是根、左、右）。

![先序深度优先遍历示意图](/images/20190726/dfs.png);

```javascript
const diffHelper = {
    Index: 0
}
function dfs(tree) {
    console.log(tree.type, diffHelper.Index);
    dfsChildren(tree.children);
}
function dfsChildren(nodeArray) {
    nodeArray.forEach(node => {
        // 每个节点都占用一个编号
        ++diffHelper.Index;
        if (node.type) {
            // 是节点，递归调用
            dfs(node);
        } else {
            // 文本节点
            console.log(node, diffHelper.Index);
        }
    })
}
```

![先序深度优先遍历结果](/images/20190726/dfs_example_result.png)

#### O(n^3) -> O(n)

对比两棵树的差异是 Diff 算法最核心的部分。

两棵树完全 Diff（对比父节点、自身、子节点是否完全一致）的时间复杂度是 O(n^3)，由于前端中跨层级移动节点的场景较少，因此 React 的 Diff 算法中利用同级比较（只比较同级元素）巧妙的将时间复杂度降低至 O(n)。

![Diff 算法使用同级比较来降低时间复杂度](/images/20190726/tree_diff.png)

同层级比较规则：

+ 如果新节点不存在，产生一个移除节点的 patch 补丁
+ 如果节点类型相同，比较属性差异，如若属性不同，产生一个关于属性的 patch 补丁
+ 如果节点类型不同，将旧节点替换成新节点，产生一个有关替换的 patch 补丁
+ 如果有新增节点，产生一个有关新增的 patch 补丁

```javascript
const diffHelper = {
    Index: 0,
    isTextNode: (eleObj) => {
        return !(eleObj instanceof Element);
    },
    diffAttr: (oldAttr, newAttr) => {
        let patches = {}
        for (let key in oldAttr) {
            if (oldAttr[key] !== newAttr[key]) {
                // 可能产生了更改 或者 新属性为undefined，也就是该属性被删除
                patches[key] = newAttr[key];
            }
        }

        for (let key in newAttr) {
            // 新增属性
            if (!oldAttr.hasOwnProperty(key)) {
                patches[key] = newAttr[key];
            }
        }

        return patches;
    },
    diffChildren: (oldChild, newChild, patches) => {
        if (newChild.length > oldChild.length) {
            // 有新节点产生
            patches[diffHelper.Index] = patches[diffHelper.Index] || [];
            patches[diffHelper.Index].push({
                type: PATCHES_TYPE.ADD,
                nodeList: newChild.slice(oldChild.length)
            });
        }
        oldChild.forEach((children, index) => {
            dfsWalk(children, newChild[index], ++diffHelper.Index, patches);
        });
    },
    dfsChildren: (oldChild) => {
        if (!diffHelper.isTextNode(oldChild)) {
            oldChild.children.forEach(children => {
                ++diffHelper.Index;
                diffHelper.dfsChildren(children);
            });
        }
    }
}

const PATCHES_TYPE = {
    ATTRS: 'ATTRS',
    REPLACE: 'REPLACE',
    TEXT: 'TEXT',
    REMOVE: 'REMOVE',
    ADD: 'ADD'
}

function diff(oldTree, newTree) {
    // 当前节点的标志 每次调用Diff，从0重新计数
    diffHelper.Index = 0;
    let patches = {};

    // 进行深度优先遍历
    dfsWalk(oldTree, newTree, diffHelper.Index, patches);

    // 返回补丁对象
    return patches;
}

function dfsWalk(oldNode, newNode, index, patches) {
    let currentPatches = [];
    if (!newNode) {
        // 如果不存在新节点，发生了移除，产生一个关于 Remove 的 patch 补丁
        currentPatches.push({
            type: PATCHES_TYPE.REMOVE
        });

        // 删除了但依旧要遍历旧树的节点确保 Index 正确
        diffHelper.dfsChildren(oldNode);
    } else if (diffHelper.isTextNode(oldNode) && diffHelper.isTextNode(newNode)) {
        // 都是纯文本节点 如果内容不同，产生一个关于 textContent 的 patch
        if (oldNode !== newNode) {
            currentPatches.push({
                type: PATCHES_TYPE.TEXT,
                text: newNode
            });
        }
    } else if (oldNode.type === newNode.type) {
        // 如果节点类型相同，比较属性差异，如若属性不同，产生一个关于属性的 patch 补丁
        let attrs = diffHelper.diffAttr(oldNode.props, newNode.props);

        // 有attr差异
        if(Object.keys(attrs).length > 0) {
            currentPatches.push({
                type: PATCHES_TYPE.ATTRS,
                attrs: attrs
            });
        }

        // 如果存在孩子节点，处理孩子节点
        diffHelper.diffChildren(oldNode.children, newNode.children, patches);
    } else {
        // 如果节点类型不同，说明发生了替换
        currentPatches.push({
            type: PATCHES_TYPE.REPLACE,
            node: newNode
        });
        // 替换了但依旧要遍历旧树的节点确保 Index 正确
        diffHelper.dfsChildren(oldNode);
    }

    // 如果当前节点存在补丁，则将该补丁信息填入传入的patches对象中
    if(currentPatches.length) {
        patches[index] = patches[index] ? patches[index].concat(currentPatches) : currentPatches;
    }
}
```

调用

```javascript
let virtualDom1 = createElement("ul", { class: "lists" }, [
    createElement("li", {}, ["1"]),
    createElement("li", { class: "item" }, ["2"]),
    createElement("li", { style: "color: red;" }, ["3"])
]);

let virtualDom2 = createElement("ul", {}, [
    createElement("div", {}, ["1"]),
    createElement("li", { class: "item" }, ["这里变了"]),
    createElement("li", { style: "color: blue;" }, [
        createElement("li", {}, ["3-1"]),
    ]),
    createElement("li", {}, ["1"]),
]);

console.log(diff(virtualDom1, virtualDom2));
```

执行结果如下图所示：

![执行 diff 后的 patch 补丁对象](/images/20190726/diff_example_result.png);

#### 同层级比较的缺陷

上面的形式对于列表存在比较大的缺陷：改变顺序的列表，所产生的开销将是巨大的。

举例来说，对于下面的两个 dom，其实发生的是一个顺序的变化，但是在同级比较中，会产生2个替换的 patch 补丁（将3替换为4，将4替换为3），实际上最优的 dom 操作，是进行移动，将3移动到4的位置。

```html
<ul>
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
</ul>
<ul>
    <li>1</li>
    <li>2</li>
    <li>4</li>
    <li>3</li>
</ul>
```

#### 列表Diff

React 引入 `key` 属性来进行列表层面的 diff 判断。

如果在书写 React 列表时，你没有给列表的每一项设置一个 `key` 值，那么在控制台上将会打印出一则警告，这是 React 在告诉你它无法高效的进行列表层面的 Diff 判断。

未引入 `key` 时，React 将采用我们刚才介绍的方式进行 Diff。

![未使用 Key 属性时列表的 Diff](/images/20190726/without_use_key_diff.png)

如上图所示，C 将会被替换成 F，D 将会被替换成 C，E 将会别替换成 D，同时新增了一个 E。

使用 `key` 属性后，React Diff 算法将可以复用元素（`key` 一致时且标签类型一致时，认为是同一元素）

![使用 Key 属性后列表的 Diff](/images/20190726/use_key_diff.png)

通过算法分析将可以知道 A、B、C、D、E 均未发生改变，因此会获得一个有关插入的 patch 补丁。它的形式可能类似于：

```
{
  type: 'REORDER',
  moves: [{remove or insert}, {remove or insert}, ...]
}
```

这个 patch 补丁所对应的 dom 操作可以是：

+ 删除元素 element.removeChild()

+ 在某一元素前面增加元素 element.insertBefore()

这一部分的代码将不会在本篇进行讲述。

#### 修补补丁

通过 diff 算法可以得到 patch 补丁对象，现在我们就可以根据 patch 补丁对象进行修补补丁。

```javascript
let patches = diff(virtualDom1, virtualDom2);

patch(dom, patches);
```

补丁对象的形式如下，我们可以从中得知第 n 个节点需要打的补丁。

```javascript
patches = {
    0: [{
        type: 'ATTR',
        attrs: {
            class: undefined
        }
    }],
    3: [{
        type: 'TEXT',
        text: "这里变了"
    }]
}
```

我们要执行更新，也要做一遍先序深度优先遍历，并执行相关的补丁操作。

```javascript
const patchHelper = {
    Index: 0
}

function patch(node, patches) {
    dfsPatch(node, patches);
}

function dfsPatch(node, patches) {
    let currentPatch = patches[patchHelper.Index++];
    node.childNodes.forEach(child => {
        dfsPatch(child, patches);
    });
    if (currentPatch) {
        doPatch(node, currentPatch);
    }
}

function doPatch(node, patches) {
    patches.forEach(patch => {
        switch (patch.type) {
            case PATCHES_TYPE.ATTRS:
                for (let key in patch.attrs) {
                    if (patch.attrs[key] !== undefined) {
                        setAttr(node, key, patch.attrs[key]);
                    } else {
                        node.removeAttribute(key);
                    }
                }
                break;
            case PATCHES_TYPE.TEXT:
                node.textContent = patch.text;
                break;
            case PATCHES_TYPE.REPLACE:
                let newNode = patch.node instanceof Element ? render(patch.node) : document.createTextNode(patch.node);
                node.parentNode.replaceChild(newNode, node);
                break;
            case PATCHES_TYPE.REMOVE:
                node.parentNode.removeChild(node);
                break;
            case PATCHES_TYPE.ADD:
                patch.nodeList.forEach(newNode => {
                    let n = newNode instanceof Element ? render(newNode) : document.createTextNode(newNode);
                    node.appendChild(n);
                });
                break;
            default:
                break;
        }
    })
}
```

## React Fiber

> 这一部分大量引用了 [Deep In React 之浅谈 React Fiber 架构（一）](https://juejin.im/post/5d12c907f265da1b6d4033c5) 的文章内容，您也可以直接阅读这一篇内容来了解 Fiber 的相关内容。

React 主要有两个阶段：

+ 调和阶段(Reconciler)：React 通过先序深度优先遍历生成 Virtual DOM，然后通过 Diff 算法，获得变更补丁(Patch)，放到更新队列里面去。

+ 渲染阶段(Renderer)：遍历更新队列，通过调用宿主环境的API，实际更新渲染对应元素。宿主环境，比如 DOM、Native、WebGL 等。

> 更多关于调和阶段的解释可以点击 [这里](https://zh-hans.reactjs.org/docs/reconciliation.html)

从刚才我们的实现来看，代表了调和阶段一旦开始，就无法 **中断**。该功能将一直占用主线程， 一直要等到整棵 Virtual DOM 树计算完成之后，才能把执行权交给渲染引擎。

这样的情况导致一些用户交互、动画等任务无法立即得到处理，容易造成卡顿、失帧等现象，影响用户体验。

Fiber 的诞生正是为了解决这个问题。

#### 什么是Fiber

为了解决这个问题，有以下几个可供改进的地方：

+ 暂停工作，稍后再回来。
+ 为不同类型的工作分配优先权。
+ 重用以前完成的工作。
+ 如果不再需要，则中止工作。

为了做到这些，我们首先需要一种方法将任务分解为单元。从某种意义上说，这就是 Fiber，Fiber 代表一种工作单元。

Fiber 就是重新实现的堆栈帧，本质上 Fiber 也可以理解为是一个 **虚拟的堆栈帧**，将可中断的任务拆分成多个子任务，通过按照优先级来自由调度子任务，分段更新，从而将之前的同步渲染改为异步渲染。

所以我们可以说 Fiber 是一种数据结构(堆栈帧)，也可以说是一种解决可中断的调用任务的一种解决方案，它的特性就是 **时间分片(time slicing)和暂停(supense)**。

关于 Fiber，本篇不再展开讲述，这里提及只是为了说明在 Fiber 架构引入后，React的 diff 将会在浏览器有“空闲”的时候进行可中断的执行。

## 代码

本文代码你可以在 [我的Github仓库](https://github.com/yuzhounanhai/yuzhounanhai.github.io/tree/master/project/virtualDom) 中找到。


## 参考资料

+ [深入浅出 React（四）：虚拟 DOM Diff 算法解析](https://www.infoq.cn/article/react-dom-diff/)

+ [深度剖析：如何实现一个 Virtual DOM 算法](https://github.com/livoras/blog/issues/13)

+ [Deep In React 之浅谈 React Fiber 架构（一）](https://juejin.im/post/5d12c907f265da1b6d4033c5)