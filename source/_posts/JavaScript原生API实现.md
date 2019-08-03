---
title: 原生API的实现
isLock: true
categories:
- 前端
tags:
- 原理
- JS
---

<!-- more -->

## 实现 call

```javascript
Function.prototype.call2 = function(context) {
    context = context || window;
    var fn = "__callcontext__";
    context[fn] = this;
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push("arguments[" + i + "]");
    }
    var result = eval("context[fn](" + params.join(,) + ")");
    delete context[fn];
    return result;
}
```

```javascript
// use es6
Function.prototype.call2 = function(context, ...args) {
    context = context || window;
    var fn = Symbol();
    context[fn] = this;
    var result = context[fn](...args);
    delete context[fn];
    return result;
}
```

## 实现 apply

```javascript
Function.prototype.apply2 = function(context, args) {
    context = context || window;
    args = args || [];
    var fn = "__applycontext__";
    context[fn] = this;
    var params = [];
    for (var i = 0; i < args.length; i++) {
        params.push("arguments[" + i + "]");
    }
    var result = eval("context[fn](" + params.join(,) + ")");
    delete context[fn];
    return result;
}
```

```javascript
// use es6
Function.prototype.apply2 = function(context, args) {
    context = context || window;
    args = args || [];
    var fn = Symbol();
    context[fn] = this;
    
    var result = context[fn](...args);

    delete context[fn];
    return result;
}
```

## 实现 bind

```javascript
Function.prototype.bind2 = function(context) {
    var _this = this;
    var arg1 = [].prototype.slice(arguments, 1);
    return function() {
        var arg2 = [].prototype.slice(arguments);
        return _this.apply(context, arg1.concat(arg2));
    }
}
```

## 实现 Promise/A+ 规范定义的 Promise

> [Promise/A+ 规范中文](https://segmentfault.com/a/1190000002452115)
> [Promise/A+ 规范英文](https://promisesaplus.com/)
> [实现参考](https://juejin.im/post/5aa7868b6fb9a028dd4de672)

简单框架

```javascript
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function Promise(excutor) {
    var self = this;
    self.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    function resolve(value) {
        // 为什么resolve 加setTimeout?
        // 2.2.4规范 onFulfilled 和 onRejected 只允许在 execution context 栈仅包含平台代码时运行.
        // 注1 这里的平台代码指的是引擎、环境以及 promise 的实施代码。实践中要确保 onFulfilled 和 onRejected 方法异步执行，且应该在 then 方法被调用的那一轮事件循环之后的新执行栈中执行。

        setTimeout(() => {
            // 调用resolve 回调对应onFulfilled函数
            if (self.status === PENDING) {
                // 只能由pending状态 => fulfilled状态 (避免调用多次resolve reject)
                self.status = FULFILLED;
                self.value = value;
                self.onFulfilledCallbacks.forEach(cb => cb(self.value));
            }
        });
    }

    function reject(reason) {
        setTimeout(() => {
            if (self.status === PENDING) {
                self.status = REJECTED;
                self.reason = reason;
                self.onRejectedCallbacks.forEach(cb => cb(self.reason));
            }
        });
    }

    try {
        excutor(resolve, reject);
    } catch(e) {
        reject(e);
    }
}
```

## 实现 async await

async 函数的实现原理，就是将 Generator 函数和自动执行器，包装在一个函数里。

```javascript
async function fn(args) {
  // ...
}

// 等同于

function fn(args) {
  return spawn(function* () {
    // ...
  });
}

// spawn 函数的实现
function spawn(genF) {
  return new Promise(function(resolve, reject) {
    const gen = genF();
    function step(nextF) {
        let next;
        try {
            next = nextF();
        } catch(e) {
            return reject(e);
        }
        if(next.done) {
            return resolve(next.value);
        }
        Promise.resolve(next.value).then(function(v) {
            step(function() { return gen.next(v); });
        }, function(e) {
            step(function() { return gen.throw(e); });
        });
    }
    step(function() { return gen.next(undefined); });
  });
}
```