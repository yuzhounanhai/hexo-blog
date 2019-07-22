---
title: 浅析VUE双向绑定原理
categories:
- 前端
tags:
- Vue
---

VUE 是一种基于数据截获来实现双向绑定的，这篇文章将浅显的分析一下 VUE 是如何实现双向绑定的，并根据原理，简要实现这部分代码。

## MVVM

MVVM 目前是一种前端开发的架构模式，其三个组成部分是模型（Model）、视图（View）、视图模型（View Model）。
MVVM 使视图和逻辑得以分开，交由视图模型统一管理，由数据驱动视图模型更新，从而影响视图更新；
而交互所造成的变动，也将反应在视图模型上。

<!-- more -->

![mvvm模型](/images/20190704/mvvm.png)

## MVC 和 MVVM

MVC 是应用广泛的软件架构的其中一种，MVC 三个字母分别代表了模型（Model）、视图（View）、控制器（Controller）。
MVC 一般是一种单向通信的方式（V -> C -> M -> C），但实际项目中可能会对MVC的通信方式进行变更，例如增加 C -> V 的通信道路等。

常规的 MVC 和 MVVM 项目，它们的通信方式是不一样的，而 MVVM 架构最主要的区别就是双向绑定。

## 一句话概括 VUE 双向绑定实现原理

VUE 通过 ES5 提供的 `Object.defineProperty()` 方法，截获数据的 `get` 和 `set` 方法，结合观察者-订阅者模式，检查并记录依赖，当数据发生更新时，通知所有有关联的订阅依赖进行更新。

#### Object.defineProperty()

ES5在定义只有内部采用的特性时，描述了属性的各种特征，提供了两种属性的读写方式：

1. 数据属性
+ Configurable: 表示能否通过delete删除属性从而重新定义属性，能否修改属性的特性，或者能否把属性修改为访问器属性。
+ Enumerable: 表示能否通过for-in循环返回属性。
+ Writable: 表示能否修改属性的值。
+ Value: 表示这个属性的数据值。


2. 访问器属性
+ Configurable
+ Enumerable
+ Get: 读取属性时调用的函数，默认为undefined
+ Set: 在写入属性时调用的函数，默认为undefined

要修改属性默认的特性，必须使用ES5提供的Object.defineProperty()方法。
这个方法接收三个参数：属性所在的对象、属性名、描述符对象

```javascript
Object.defineProperty(obj, property, {
    configurable: true,
    // ...
})
```

## 实现步骤

在我们使用 `new Vue({})` 方法，传入一个 Vue 对象的对象字面量时，VUE 应该去做以下事情：

+ 解析数据
+ 解析模板
+ 绑定模板和数据

这三个步骤是十分浅显可以了解的，解析了数据和模版后，程序才能理解什么位置该填充什么数据，而绑定模版和数据，也是为了在数据发生变更时，模版视图能够及时刷新。
实际上，我们在使用 `new` 操作符实例化 VUE 对象后，整个构造函数大致的跑了以下这个流程：

![vue原理流程图](/images/20190704/new_vue.png)

整个流程图较为"庞大"，后面的章节将会紧密贴合这个图进行讲解。我先来简单的介绍一下这个流程图的流程：

+ 在使用 `new` 操作符后，分别进行解析数据和解析模版的工作

+ 构建观察者-订阅者结构，绑定模板和数据

简单分析得到的其实也就是我们之前所分析到的三个工作。

#### 如何使用

在开始了解原理之前我们先来回忆一下我们该如何使用构造函数。它应该是这样被使用的：

```javascript
var mvvm = new Vue({
    el: "#container",
    data: {
        name: "nanhai",
        num: 1,
        color: "red"
    },
    methods: {
        changeNum: function () {
            this.num++;
        }
    }
});
```
从本文之前的“一句话概括 VUE 原理”中，我们不难联系出这样一个结果：

+ new Vue(options)后，需要获得传入options内的el，拿到对应的dom，解析模板。

+ 解析options中的其他数据，如 data ，通过 `Object.defineProperty()`，设立 `get` / `set` 方法，截获数据。


#### new MVVM()
接下来将实现一个 MVVM 方法，来做与 VUE 类似的工作。从前文可得，这个构造函数内首当其冲的工作是解析数据（observe）和解析模板（Compile）

```javascript
function MVVM (options) {
    this._options = options || {};
    var data = this._data = this._options.data || {};
    // 解析数据
    observe(data);
    // 解析模板
    new Compile(this._options.el || document.body, this);
}
var mvvm = new MVVM({
    el: "#container",
    data: {
        name: "nanhai",
        num: 1,
        color: "red"
    },
    methods: {
        changeNum: function () {
            this.num++;
        }
    }
});
```

#### 数据代理
在上面实现的构造函数中，先来思考一下怎么拿到 data 中定义的数据？（比如拿 name ）
我们需要通过 `mvvm._data.name` 这样的方式来拿到 name 数据，但是这样的方式与我们在使用 VUE 时并不一致，所以我们需要进行一个数据代理。
所谓的数据代理，其实也就是将 `mvvm._data` 上的数据，全部映射到 `mvvm` 上。通过 `Object.defineProperty()` 方法可以轻松的实现这一映射。

```javascript
MVVM.prototype = {
    _proxyData: function (key) {
        var self = this;
        Object.defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return self._data[key];
            },
            set: function proxySetter(newValue) {
                self._data[key] = newValue;
            }
        })
    }
}
```

在实现完映射方法后，我们只需要遍历 data 中的 key ，然后调用 `_proxyData` 方法即可。

```javascript
function MVVM (options) {
    this._options = options || {};
    var data = this._data = this._options.data || {};
    // 增加这段代码
    var self = this;
    Object.keys(data).forEach(function (key) {
        self._proxyData(key);
    });
    // 结束
    observe(data);
    new Compile(this._options.el || document.body, this);
}
```

#### observe 数据解析

数据解析，实质就是为数据绑定 `get` 和 `set` 方法，使在读、写数据时能够截获到这个操作。因此这一段代码也就是调用 `Object.defineProperty()` 这个 api 进行实现。

```javascript
function observe (data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    Object.keys(data).forEach(key => {
        observeProperty(data, key, data[key])
    })
}

function observeProperty(data, key, val) {
    // 监听子属性
    observe(val);
    Object.defineProperty(data, key, {
        // 可枚举
        enumerable: true,
        // 不能再define
        configurable: false,
        get: function () {
            return val;
        },
        set: function (newVal) {
            if (
                newVal === val || 
                (
                    newVal !== newVal
                    && val !== val
                )
            ) {
                return
            }
            val = newVal;
        }
    });
}
```


> 判断两个值一样的判断方法是： `newVal === val || ( newVal !== newVal && val !== val )`
> 为什么要多此一举呢？因为 NaN 永远不等于 NaN

#### compile 模板解析

Compile的工作是解析模板，将模板中的变量、指令替换成数据，对视图进行初始化操作

步骤：
1. 拿到模板部分的dom节点
2. 遍历各节点，解析属性指令和 \{ \{ \} \}变量  
3. 将解析好的内容，重新插入回原来的位置中。

```javascript
function Compile($el, vm) {
    this.$el = this.isElementNode($el) ? $el : document.querySelector($el);
    this._vm = vm;
    if (this.$el) {
        // 由于会频繁的进行dom操作，为了优化性能，将节点先移入documentFragement。
        this.$fragment = this.nodeToFragment(this.$el);
        this.compileElement(this.$fragment);
        this.$el.appendChild(this.$fragment);
    }
}
```

#### compileElement()

compileElement是Compile的核心，做遍历解析的工作。
1. 遍历结点
2. 验证节点类型
3. 匹配模版
4. 替换变量并根据指令做处理

```javascript
// <div class="div">div内部的文字</div>
compileElement: function ($el) {
    var self = this;
    var childNodes = $el.childNodes;
    [].slice.call(childNodes).forEach(function ($childNode) {
        if (self.isElementNode($childNode)) {
            // 解析节点，但不包括节点内部的文本(内部的文本属于子节点)
            // 这一步其实是解析的属性（写在属性上的指令）
            self.compileElementNode($childNode);
            // 如果有子节点，解析子节点
            if ($childNode.childNodes && $childNode.childNodes.length) {
                self.compileElement($childNode);
            }
        } else if (self.isTextNode($childNode)) {
            // 纯文本，解析文本中的模板区域
            self.compileTextNode($childNode);
        }
    })
}
```

```javascript
// compileTextNode
compileTextNode: function ($node) {
    var text = $node.textContent;
    var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
    var match = defaultTagRE.exec(text);
    if (match) {
        // do something...
    }
}

// compileElementNode
compileElementNode: function ($node) {
    var nodeAttrs = $node.attributes,
        self = this;
    [].slice.call(nodeAttrs).forEach(function (nodeAttr) {
        var attrName = nodeAttr.name;
        var dir;
        // 规定以v-xxx为指令
        if (dir = self.isDirective(attrName)) {
            // 如果是指令，则进行指令解析
            var attrValue = nodeAttr.value;
            if (self.isEventDirective(dir)) {
                // 事件指令，如v-on:click @click
            } else if (self.isBindDirective(dir)) {
                // v-bind:class :class
            } else {
                // 普通指令 v-model等
            }
        }
    })
}
```

#### 实例化观察者

在什么时候实例化观察者？

我们再来看看流程图：

![vue原理流程图](/images/20190704/new_vue.png)

从流程图中我们不难发现，实例化观察者是在模板解析过程中，也就是说我们在遇到指令、\{ \{ \} \} 这些内容的时候，我们就要实例化一个 Watcher。

以 `compileTextNode` 为例，在我们匹配到\{ \{ \} \} 时，其实我们需要拿 `data` 中的变量进行填充。

```javascript
compileTextNode: function ($node) {
    // ...
    if (match) {
        // do something
        CompileUtils.text($node, this._vm, match[1])
    }
}
var CompileUtils = {
    text: function ($node, vm, exp) {
        // 获得回调函数，这个函数是处理{{}}、v-text这两种模板指令的
        var updateFn = updater.textUpdater;
        // 获得数据 {{name}} 也就是去取mvvm.name的值
        var value = this._getVmValue(vm, exp);
        // 执行回调更改视图
        updateFn($node, value);
        // 绑定观察者
        this.bindWatch($node, vm, exp, updateFn);
    },
    bindWatch: function ($node, vm, exp, cb) {
        new Watcher(vm, exp, function (value) {
            cb && cb($node, value);
        });
    }
}
var updater = {
    textUpdater: function (node, value) {
        node.textContent =
            typeof value === 'undefined'
            ? ''
            : value;
    }
}
```

在代码中定义了某一指令的处理方法 `updater.textUpdater`, 这个方法可以作为一个回调方法传入 Watcher 实例中，待 Watcher 收到更新的通知时，可以执行这个回调方法去更新视图。

#### Watcher

![vue原理流程图](/images/20190704/new_vue.png)

我们再来观察一遍流程图，来了解 Watcher 做了什么事情：

+ 在自身实例化时往属性订阅器(dep)里面添加自己
+ Dep下发通知时，能调用自身的update()方法，执行由new Watcher时传递进来的回调更新dom。

```javascript
function Watcher (vm, exp, cb) {
    this._vm = vm;
    this._exp = exp.trim();
    this._cb = cb;
    // 需要往dep中添加自己
}

Watcher.prototype = {
    update: function () {
        // 拿到newValue, 其实就是vm中的数据，代码省略
        this._cb.call(this._vm, newValue);
    }
}
```

#### Dep事件处理中心

在流程图中还有最后一个成员 Dep 事件处理中心。Dep 需要做的事情有：

+ Watcher实例化时，需要往Dep中添加该实例。（Dep中存储着Watcher的实例）
+ 收到数据变化时需要下发通知，即执行Watcher实例中传入的回调方法。

```javascript
function Dep () {
    this.subs = [];
}

Dep.prototype.addSub = function addSub (sub) {
    this.subs.push(sub);
}

Dep.prototype.notify = function notify () {
    this.subs.forEach(function (sub) {
        sub.update();
    })
}
```

#### Dep 会在哪里收到更新的通知

通过 `Object.defineProperty()` 方法我们截获到了数据的更改，数据更改时需要更新视图，也就是说我们需要在 `Set` 方法中动刀子。

从流程图中我们也可以看出是在 `observe` 中进行实例化 Dep 对象。

```javascript
Object.defineProperty(data, key, {
    // ...
    set: function (newVal) {
        if (newVal === val || (newVal !== newVal && val !== val)) {
            return
        }
        val = newVal;
        // 数据发生变化，通知更新
        dep.notify();
    }
});
```

#### Watcher 怎么添加到 Dep 中？

这里存在一个比较困难的问题：

不同的数据有不同的 `Dep` 进行管理，每个 `Dep` 管理着与这个数据有关的 `Watcher`。
`Watcher` 实例化时，我们需要将 `Watcher` 添加到与之相关的 `Dep` 中。
如何知晓 `Dep` 和 `Watcher` 是有关系的？

再者，我们回忆一下如何将 `Watcher` 添加到 `Dep` 中？
是调用 `dep.addSub()` 方法。

而我们已经在 `Object.defineProperty()` 这个闭包内使用 `dep` 的实例，也就是说我们需要在这个闭包中将 `Watcher` 和 `Dep` 建立联系。

这是可能的吗？

答案是可能的。

#### Get方法是切入口

Watcher实例化时通过读取一次数据，就能将Watcher实例添加到dep中！

```javascript
function observeProperty(data, key, val) {
    var dep = new Dep();
    observe(val);
    Object.defineProperty(data, key, {
        // ...
        get: function () {
            // 传入的是什么？
            // 每次读取是否都要添加一次？
            dep.addSub(...);
            return val;
        },
        set: function (newVal) {
            if (newVal === val || (newVal !== newVal && val !== val)) {
                return
            }
            val = newVal;
            dep.notify();
        }
    });
}
```

在代码中存在两个注释（问题）：
+ 传入的是什么？
+ 每次读取是否都要添加一次？

首先第一个问题，我们知道传入的必定是一个 `Watcher` 实例。
第二个问题，我们也能很快的知晓必定不是，读取数据的情况太多了，肯定有一些读取情况是不需要增加观察者实例的。

结合这两个疑问，不难得出：需要把控添加观察者实例的场合。
而纵观所有场景，我们也只有在执行 `new Watcher()` 时需要往 `Dep` 中添加观察者实例。

#### 把控观察者实例的增加场合

直接看代码。

```javascript
// flag
Dep.target = null;

function Watcher (vm, exp, cb) {
    // 需要往dep中添加自己
    this.value = this.get();
}

Watcher.prototype = {
    get: function () {
        // flag 指向 Watcher 实例
        Dep.target = this;
        var value = this._vm[this._exp];
        // 读取完毕后 清空flag
        Dep.target = null;
        return value;
    }
}

Object.defineProperty(data, key, {
    // ...
    get: function () {
        // 如果flag中存在内容（Watcher实例），就将其加入到Dep中
        if (Dep.target) {
            dep.addSub(Dep.target);
        }
        return val;
    }
});
```

## 一些课后问题

#### VUE截获到数据更新后，会通知所有组件进行更新吗？为什么？

**不会**，由Vue的双向绑定原理中可以知道，每一个 Dep 实例化后的对象都会存在一个独立的 subs 数组。在 `Object.defineProperty()` 截获数据阶段，会为每一个属性生成一个 `Dep` 实例，当有内容与数据产生联系时，会通过 `Dep` 实例原型链上的 `addSub` 方法，将 `Watcher` 加入到该实例独立的订阅者数组中。当要更新时，只会执行该 Dep 实例独立订阅者数组中保存着的所有 `Watcher` 订阅者的更新回调。

#### 为什么能够直接通过实例属性，访问到VUE对象上data里面的数据？

使用了访问属性代理，通过 `Object.defineProperty()` 方法，在 VUE 对象上创建了一个同名属性，当 `get` 时，返回的是 `data` 中的同名属性的值，在 `set` 时，修改的是 `data` 中同名属性的值。

## 源码

本文所有的代码存放在 [我的GitHub仓库](https://github.com/yuzhounanhai/yuzhounanhai.github.io/tree/master/project/mvvm) 中。