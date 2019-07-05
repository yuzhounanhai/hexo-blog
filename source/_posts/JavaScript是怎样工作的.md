---
title: JavaScript 是怎样工作的
---

JavaScript 是单线程的执行语言，它的 API 是由各个浏览器厂商进行实现的，所谓的兼容性问题也就是说标准的不统一，在实现上存在差异（实现的方法名、实现功能的浏览器版本）。

本文将介绍 JS 语言的执行，也就是事件循环（Event Loop）相关的内容。

## V8 引擎

最具代表性的一个 JavaScript 引擎是 Chrome 的 V8 引擎，它被使用在 chrome 浏览器、NodeJS 中。如果用一个简单的模型来描述它，就是这个样子的：

<!-- more -->

![v8引擎](/images/20190705/v8.png)

从图中不难看出，引擎包括了两个重要的组件：内存堆和调用栈。这两个重要组件的作用，将会在后面进行介绍。

堆是一个内存存储空间，它不关注内部储存内容的保存顺序，堆中保存了所有正在被使用的变量和对象。同时也保存了一些当前作用域已经不会再被使用的但还没被垃圾回收机制回收的帧。

一个帧是一个连续的工作单元。当一个 JS 函数被调用时，运行时环境就会在栈中创建一个帧。帧里保存了特殊的函数参数和局部变量。当函数返回时，帧就被从栈中推出。

## 运行时

![运行时](/images/20190705/runtime.png)

许多我们开发者乐意广泛使用的方法、函数，像DOM、BOM、AJAX、setTimeout等。也就是我们俗称的WEB APIs。V8 引擎不提供这些 APIs，所以这些 APIs 从哪里来？因此，js运行会比我们预想的更为复杂一些。所谓的运行时，其实就是包括了 JS 运行时所必须的“组成部分”：如 WEB APIs、 事件循环、调用栈、回调队列等。

## 调用栈

调用栈中存储的是调用的信息。根据调用情况进行压栈、出栈。

```javascript
function multiply(x, y) {
    return x * y;
}

function printSquare(x) {
    var s = multiply(x, x);
    console.log(s);
}

printSquare(5);
```

对于以上代码，调用栈是这样工作的：

![调用栈实例](/images/20190705/callStackEG.png)

1. JS开始执行，执行到 `printSquare(5);`，将此语句压栈；发现调用信息，进行调用该函数；

2. 进入到 `printSquare` 内部，执行 `var s = multiply(x, x);` 语句；将该语句压栈；发现调用信息，进行调用该函数；

3. 进入到 `multiply` 函数内部，return 结果，调用结束，语句出栈。继续执行下一条 `console.log(s)`, 将语句压栈；

4. 打印完毕，该语句出栈；

5. 该函数执行完毕，`printSquare(5)` 出栈


## 事件循环 Event Loop

JavaScript是一个单线程的编程语言，并发相关的情况，看似是“多线程”的事件，其实都是用单线程模拟出来的。

而单线程也是一个限制，单线程意味着一件事：同一个时间段只能做一件事。而目前许许多多的场景如计时器等等，其实每时每刻都在做着类似于多线程的事情，每时每刻都有事情在做，页面就不会响应用户的操作，这也就是线程的阻塞。

事件循环（Event Loop）为了实现线程的不阻塞应运而生。


## 同步和异步

JavaScript 中存在同步代码和异步代码,对于同步代码，它们会依次执行。对于异步代码，它们会在特定的时候回调执行，如代码中的setTimeout计时器，它会在一秒后回调执行一个打印。

```javascript
console.log('hello 0');
console.log('hello 1');
console.log('hello 2');
// hello 0
// hello 1
// hello 2

setTimeout(() => {
    console.log('hello 0');
}, 1000);
console.log('hello 1')
// hello 1
// hello 0
```

JS 引擎线程只会关心异步的发起函数是谁、回调函数是什么？并将异步交给 webapi 去处理，然后继续执行其他任务。下面我们具体来了解一下 JS 的执行流程。

## 执行流程

![运行时](/images/20190705/runtime.png)

我们再来观察一下运行时的这张图，事件循环在这张图中具备什么作用？

Event Loop有一个简单的工作：监控Call Stack和Callback Queue。
如果调用堆栈为空，它将从队列中获取第一个事件，并将其推送到调用堆栈。
下面详细的查看一遍流程：

1. 左上角是执行的代码，左下角是控制台console输出的结果，右侧是运行时环境。对于执行代码，从上到下依次执行。

![执行流程](/images/20190705/run1.png)

2. 首先，第一条语句被加入到了调用栈中

![执行流程](/images/20190705/run2.png)

3. 这条语句被执行了，在控制台输出了一个Hi

![执行流程](/images/20190705/run3.png)

4. 随即，这条语句被移出了调用栈

![执行流程](/images/20190705/run4.png)

5. setTimeout被移入调用栈

![执行流程](/images/20190705/run5.png)

6. setTimeout被执行，浏览器的WEB APIs创建了一个计时器，为你处理倒计时

![执行流程](/images/20190705/run6.png)

7. setTimeout本身已经执行完毕，被移出调用栈

![执行流程](/images/20190705/run7.png)

8. 最后一条打印语句被移入调用栈

![执行流程](/images/20190705/run8.png)

9. 执行这一语句，在控制台输出一个Bye

![执行流程](/images/20190705/run9.png)

10. 语句执行结束，被移出调用栈

![执行流程](/images/20190705/run10.png)

11. 计时器计时到五秒结束，将回调cb1函数加入到回调队列中

![执行流程](/images/20190705/run11.png)

12. **Event Loop查看到call Stack为空**，于是将回调队列中的第一个回调事件，加入到调用栈中

![执行流程](/images/20190705/run12.png)

13. 将cb1中的打印语句压栈调用

![执行流程](/images/20190705/run13.png)

14. 执行打印语句，在控制台输出cb1

![执行流程](/images/20190705/run14.png)

15. 执行结束，依次出栈

![执行流程](/images/20190705/run15.png)

16. 执行结束，依次出栈

![执行流程](/images/20190705/run16.png)

> setTimeout设置1秒后执行回调，是真的在一秒钟之后执行吗？
> 一秒钟后，WEB APIs只会将回调函数推入到回调队列中，等待Event Loop检测到Call Stack为空时，才会依次将回调推入到调用栈中进行执行。所以并不会真的在一秒钟后执行。

## 诡异的setTimeout

```javascript
setTimeout(() => {
    console.log(2);
}, 2);

setTimeout(() => {
    console.log(1);
}, 1);

setTimeout(() => {
    console.log(0)
}, 0);
```

上述代码的执行结果会是什么？

+ A. 0 1 2
+ B. 2 1 0
+ C. 1 0 2
+ D. 其他答案

在揭晓结果之前，我们先来分析一下AB选项答案产生的原因

A.从回调时间来看，0毫秒的回调会最先加入到回调队列中，1毫秒的其次，2毫秒的最后加入，由于事件循环总是读取第一个回调队列中的项推入到调用栈中执行，所以输出的结果是0 1 2.

B选项，有一定经验的开发，会喜欢选择这一个选项，因为MDN上，介绍了一则关于最小延迟的说明，这些代码的时间都小于4毫秒，因此，所以回调被加入到回调队列中的时刻都是一致的，此时会按照从上到下的规则加入，因此执行结果是2 1 0.

然而结果真的是这样吗？我们直接来运行这段代码：

![执行结果](/images/20190705/sp_setTimeout.png)

执行结果是 1 0 2，为什么会是这个情况呢？

![相关说明](/images/20190705/sp_setTimeout1.png)

在规范中有这样的说明，规范对最小延迟的时间进行了休整。斗胆推测：一开始HTML5规范确实有最低4ms的规范，不过在后续修订中进行了修改，不排除规范在向实现看齐，也就是说，我们如今的开发确实出现了需要更低毫秒数的需求，即产生一种逆向影响。

因此在进行低毫秒数的编码时，要注意各个浏览器的特性。

## 宏任务与微任务

setTimeout是ES5之前常用的异步事件。但在ES6中，除了引入了一些全新的异步代码，如promise，同时也引入了一个全新的概念：宏任务与微任务。
我们知道 Promise 是 ES6 引入的一个异步方法，那么按照刚才我们所说的，这段代码执行结果应该是什么？

```javascript
console.log('script start');

setTimeout(function() {
    console.log('timer over');
}, 0);
var promise = new Promise((resolve) => {
    console.log('promise');
    resolve();
});
promise.then(() => {
    console.log('promise cb');
})
console.log('script end');
```

凭借我们刚刚学习得到的，以上代码的执行结果是:
> 注意以下只是思维步骤的一部分，并 **不是正确答案！**
> script start
> promise
> script end
> timer over
> promise cb

但是实际的执行结果是：

```javascript
// script start 
// promise
// script end
// promise cb
// timer over
```

为什么 promise 的回调会先于 timeout ?

这就是宏任务与微任务概念引入后运行时发生的变化。

## ES6中的运行时

![es6运行时](/images/20190705/es6_runtime.png)

ES6中引入了全新的概念宏任务与微任务后，运行时发生了变化，可以看见在回调队列中，分成了两个队列，一个是宏任务队列，一个是微任务队列。

微任务的执行优先级会更高，当宏任务与微任务同时存在时，如果此时Event Loop需要安排事件到调用栈中执行，那么会将微任务队列中所有事件推入并执行。这也就解释了刚才的代码中，promise cb会比timer更早打印的原因。

所以明白哪些是宏任务哪些是微任务变得尤为重要。

这里简要的罗列几个常用的宏任务和微任务，其余不常用后面大家有用到的时候可以自行查资料。

> macro-task(宏任务)：包括整体代码script，setTimeout，setInterval
> micro-task(微任务)：new Promise().then(回调)，process.nextTick

最后，我们再梳理一遍加入了宏任务与微任务这个概念后，整个运行时的运行过程

## 总结：运行过程

1. JavaScript内核加载代码到调用栈
2. 调用栈依次执行主线程的任务，遇到异步调用的语句时，交由WEB APIs执行，并添加回调事件到回调队列中。微任务事件添加到微任务队列中；宏任务事件添加到宏任务队列中
3. 当调用栈为空时，Event Loop读取微任务回调队列中所有事件，推入到调用栈中执行。
4. 3执行完毕后，若调用栈继续为空时，会依次取出宏任务队列中的回调事件，推入调用栈中执行。
5. 若过程中又再遇到微任务或者宏任务，继续分队列，继续事件循环。

## 课后练习

#### 1.
```javascript
let promiseGlobal = new Promise(resolve=>{
    console.log(1)
    resolve('2')
})
console.log(3) 

promiseGlobal.then(data => {
    console.log(data)
    let setTimeoutInner = setTimeout(() => {
        console.log(4)
    }, 1000)
    let promiseInner =new Promise(resolve=>{
        console.log(5) 
        resolve(6)
    }).then(data=>{
        console.log(data)
    })
})

let setTimeoutGlobal = setTimeout(() => {
    console.log(7);
    let promiseInGlobalTimeout = new Promise(resolve=>{
        console.log(8); 
        resolve(9)
    }).then(data=>{
        console.log(data)
    })
},1000);
```

#### 2.

> 提示：async 函数，可以理解为是 Generator 函数的语法糖。它建立在 promise 之上，总是与 await 一起使用的。

```javascript
async function async1 () {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}

async function async2 () {
    console.log('async2');
}

console.log('script start');

setTimeout(function () {
    console.log('setTimeout');
}, 0);

async1();

new Promise(function (resolve) {
    console.log('promise1');
    resolve();
}).then(function () {
    console.log('promise2');
});

console.log('script end');
```
> 这一题 promise2 和 async1 end 的打印顺序会根据不同浏览器存在差异。

## 其他阅读

#### 为什么 JS 选择了单线程模型，而没有选择多线程？

> JS 的单线程，与它的用途有关。作为浏览器脚本语言，JS的主要用途是与用户互动，以及操作DOM。这决定了它只能是单线程，否则会带来很复杂的同步问题。比如，假定JS同时有两个线程，一个线程在某个DOM结点上添加内容，另一个线程删除了这个节点，这时浏览器应该以哪个线程为准？
> 所以为了避免复杂性，从一诞生，JS就是单线程。这已经成为了JS的核心特征，在将来也不会改变。