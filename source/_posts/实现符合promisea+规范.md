---
title: 实现符合Promise A+规范的promise
categories:
- 前端
tags:
- 原理
- JS
---

## promise的简单使用

promise是异步的解决方案之一，可以通过实例化 Promise 类，并传入一个 executor 来进行使用。
executor 是一个函数，该函数的两个参数分别是 resolve 和 reject 。它们是两个由 JavaScript 引擎提供的函数。分别用以成功回调以及错误回调。

```javascript
const p = new Promise(function(resolve, reject) {
    if (/*异步操作成功*/) {
        resolve(value);
    } else {
        reject(error);
    }
})
```
<!-- more -->
Promise 实例生成以后，可以用 then 方法分别指定 resolved 状态和 rejected 状态的回调函数。

```javascript
p.then(function(value) {
    // success
}, function(reason) {
    // error
});
```

#### 简单实现

根据上述使用简单实现 promise：

```javascript
function Promise(executor) {
    let self = this;    // 缓存当前promise实例
    function resolve() {}
    function reject() {}
    try {
        executor();
    } catch(e) {
        reject(e);
    }
}

Promise.prototype.then = function() {}
```

以上代码将作为基本内容，将会结合后面的 promise A+ 规范进行改造。

## Promise A+ 规范

> [promise A+ 规范英文版](https://promisesaplus.com/)

## 实现

#### promise的状态

> 2.1: A promise must be in one of three states: pending, fulfilled, or rejected.
>   2.1.1.1: When pending, a promise: may transition to either the fulfilled or rejected state.
>   2.1.2.1: When fulfilled, a promise: must not transition to any other state.
>   2.1.3.1: When rejected, a promise: must not transition to any other state.

Promise只有三种状态，promise 的状态值必须是这三种值之一，且 pending 可变为其他状态，fulfilled、rejected 不可变。
pending为初始态。

```javascript
const PENDING = 'pending';      // add
const FULFILLED = 'fulfilled';  // add
const REJECTED = 'rejected';    // add
function Promise(executor) {
    let self = this;
    self.status = PENDING;      // add
    function resolve() {}
    function reject() {}
    try {
        executor();
    } catch(e) {
        reject(e);
    }
}
```

> 2.1.2.2: When fulfilled, a promise: must have a value, which must not change.
> 2.1.3.2: When rejected, a promise: must have a reason, which must not change.

调用 resolve 的时候，promise 将会变为 fulfilled 状态，并且变为该状态需要有一个value，也就意味着 resolve 方法将接收一个 value。
调用 reject 的时候，promise 将会变为 rejected 状态，并且变为该状态需要有一个 reason，也就意味着 reject 方法将接收一个 reason。

```javascript
function Promise(executor) {
    // other code...
    function resolve(value) {
        if (self.status === PENDING) {
            self.status = FULFILLED;
            self.value = value;
        }
    }
    function reject(reason) {
        if (self.status === PENDING) {
            self.status = REJECTED;
            self.reason = reason;
        }
    }
    // other code...
}
```

#### then method

> 2.2: A promise must provide a then method to access its current or eventual value or reason.
> A promise’s then method accepts two arguments:
> promise.then(onFulfilled, onRejected)
> 2.2.1: Both onFulfilled and onRejected are optional arguments:
>   2.2.1.1: If onFulfilled is not a function, it must be ignored.
>   2.2.1.2: If onRejected is not a function, it must be ignored.

then方法接收两个函数参数：`onFulfilled`, `onRejected`，这两个参数如果不是函数，需要被忽略(并做出兼容方法)，因此在then方法中需要判断这两个参数的类型。

```javascript
Promise.prototype.then = function(onFulfilled, onRejected) {
    onFulfilled = 
        typeof onFulfilled === 'function'
            ? onFulfilled 
            : value => value;
    onRejected = 
        typeof onRejected === 'function' 
            ? onRejected 
            : reason => { throw reason; }
}
```

###### 根据promise的状态分情况执行

> 2.2.2: If onFulfilled is a function:
>   2.2.2.1: it must be called after promise is fulfilled, with promise’s value as its first argument.
>   2.2.2.2: it must not be called before promise is fulfilled.
>   2.2.2.3: it must not be called more than once.
>
> 2.2.3: If onRejected is a function,
>   2.2.3.1: it must be called after promise is rejected, with promise’s reason as its first argument.
>   2.2.3.2: it must not be called before promise is rejected.
>   2.2.3.3: it must not be called more than once.

+ 如果是fulfilled: 执行onFulfilled()
+ 如果是rejected: 执行onRejected()
+ 如果是pending：promise中有异步请求，需要将`onFulfilled`和`onRejected`封装为回调，并使promise在状态改变时执行相关回调。

因此需要改造代码：

```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
function Promise(executor) {
    let self = this;    // 缓存当前promise实例
    self.status = PENDING;
    // 定义存放成功回调的数组
    self.onResolvedCallbacks = [];  // add
    // 定义存放失败回调的数组
    self.onRejectedCallbacks = [];  // add
    function resolve(value) {
        if (self.status === PENDING) {
            self.status = FULFILLED;
            self.value = value;
            self.onResolvedCallbacks.forEach(cb => cb(self.value)); // add
        }
    }
    function reject(reason) {
        if (self.status === PENDING) {
            self.status = REJECTED;
            self.reason = reason;
            self.onRejectedCallbacks.forEach(cb => cb(self.reason)); // add
        }
    }
    try {
        executor();
    } catch(e) {
        reject(e);
    }
}
Promise.prototype.then = function(onFulfilled, onRejected) {
    let self = this;
    onFulfilled = 
        typeof onFulfilled === 'function'
            ? onFulfilled 
            : value => value;
    onRejected = 
        typeof onRejected === 'function' 
            ? onRejected 
            : reason => { throw reason; };
    // add
    if (self.status === PENDING) {
        self.onResolvedCallbacks.push(onFulfilled);
        self.onRejectedCallbacks.push(onRejected);
    }
    
    if (self.status === FULFILLED) {
        onFulfilled(self.value);
    }
    
    if (self.status === REJECTED) {
        onRejected(self.reason);
    }
}
```

> 2.2.7: then must return a promise.
> promise2 = promise1.then(onFulfilled, onRejected);
>   2.2.7.1: If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure \[\[Resolve\]\](promise2, x).

then方法需要返回一个promise2，如果 onFulfilled 和 onRejected 返回一个值x，需要进行promise的解析。

```javascript
Promise.prototype.then = function() {
    // ...
    let promise2;
    if (self.status === PENDING) {
        return promise2 = new Promise(function(resolve, reject) {
            self.onResolvedCallbacks.push(function() {
                let x = onFulfilled(self.value);
                resolvePromise(promise2, x, resolve, reject);
            });
            self.onRejectedCallbacks.push(function() {
                let x = onRejected(self.reason);
                resolvePromise(promise2, x, resolve, reject);
            });
        });
    }
    
    if (self.status === FULFILLED) {
        return promise2 = new Promise(function(resolve, reject) {
            let x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject);
        });
    }
    
    if (self.status === REJECTED) {
        return  promise2 = new Promise(function(resolve, reject) {
            let x = onRejected(self.reason);
            resolvePromise(promise2, x, resolve, reject);
        });
    }
    // ...
}
```

>   2.2.7.2: If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
>   2.2.7.3: If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.
>   2.2.7.4: If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.

在执行 onFulfilled 或者 onRejected 时遇到了抛出的异常，promise2需要 reject 这个异常。也就是说我们需要在执行时做try-catch，下面展示部分代码：

```javascript
    if (self.status === FULFILLED) {
        return promise2 = new Promise(function(resolve, reject) {
            try {
                let x = onFulfilled(self.value);
                resolvePromise(promise2, x, resolve, reject);
            } catch(e) {
                reject(e);
            }
        });
    }
```

2.2.7.3 与 2.2.7.4 的处理其实就是上文中 onFulfilled 与 onRejected 类型判断的兼容方案：

```javascript
    onFulfilled = 
        typeof onFulfilled === 'function'
            ? onFulfilled 
            : value => value;
    // 抛出错误就会走到catch分支
    onRejected = 
        typeof onRejected === 'function' 
            ? onRejected 
            : reason => { throw reason; }
```

#### resolvePromise

> 2.3.1: If promise and x refer to the same object, reject promise with a TypeError as the reason.

```javascript
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }
}
```

> 2.3.2: If x is a promise, adopt its state:
>   2.3.2.1: If x is pending, promise must remain pending until x is fulfilled or rejected.
>   2.3.2.2: If/when x is fulfilled, fulfill promise with the same value.
>   2.3.2.3: If/when x is rejected, reject promise with the same reason.

如果x是一个promise，必须等待promise进入最终的状态后，并返回最终状态的值，按照这一说法我们可以得出以下代码

```javascript
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }
    // add
    if (x instanceof Promise) {
        if (x.status === PENDING) {
            x.then(function(y) {
                // y也可能是一个promise
                resolvePromise(promise2, y, resolve, reject);
            }, reject);
        } else {
            x.then(resolve, reject);
        }
    }
}
```

但是这部分代码不是必要的，我们完全可以将promise的执行交由resolve函数：如果value（即x）是promise，会层层执行，并执行对应的resolve和reject

```javascript
function Promise(executor) {
    // ...
    function resolve(value) {
        // add
        if (value instanceof Promise) {
            return value.then(resolve, reject);
        }
        if (self.status === PENDING) {
            self.status = FULFILLED;
            self.value = value;
            self.onResolvedCallbacks.forEach(cb => cb(self.value)); // add
        }
    }
}
```

> 2.3.3: Otherwise, if x is an object or function,
>   2.3.3.1: Let then be x.then.
>   2.3.3.2: If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
>   2.3.3.3: If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise, where:
>       2.3.3.3.1: If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
>       2.3.3.3.2: If/when rejectPromise is called with a reason r, reject promise with r.
>       2.3.3.3.3: If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
>       2.3.3.3.4: If calling then throws an exception e,
>           2.3.3.3.4.1: If resolvePromise or rejectPromise have been called, ignore it.
>           2.3.3.3.4.2: Otherwise, reject promise with e as the reason.
>   2.3.4: If then is not a function, fulfill promise with x.

```javascript
function resolvePromise(promise2, x, resolve, reject) {
    // ...
    // 避免多次调用
    let isCalled = false;
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    } else if (typeof x === 'function' && (x && typeof x === 'object')) {
        // 避免 typeof null 是 'object' 的问题
        try {
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, function(y) {
                    if (isCalled) return;
                    isCalled = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, function(r) {
                    if (isCalled) return;
                    isCalled = true;
                    reject(r);
                });
            } else { // 说明是一个普通对象/函数
                resolve(x);
            }
        } catch(e) {
            if (isCalled) return;
            isCalled = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
}
```

> 2.2.4: onFulfilled or onRejected must not be called until the execution context stack contains only platform code. [3.1].
> 注释3.1: Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that onFulfilled and onRejected execute asynchronously, after the event loop turn in which then is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate, or with a “micro-task” mechanism such as MutationObserver or process.nextTick. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

这里的意思是说 onFulfilled 和 onRejected 需要异步执行, 且应该在 then 方法被调用的那一轮事件循环之后的新执行栈中执行。

```javascript
Promise.prototype.then = function(onFulfilled, onRejected) {
    // ...
    if (self.status === PENDING) {
        return promise2 = new Promise(function(resolve, reject) {
            self.onResolvedCallbacks.push(function() {
                setTimeout(function() { // add
                    try {
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    }
                });
            });
            self.onRejectedCallbacks.push(function() {
                setTimeout(function() { // add
                    try {
                        let x = onRejected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    } 
                });
            });
        });
    }
    
    if (self.status === FULFILLED) {
        return promise2 = new Promise(function(resolve, reject) {
            setTimeout(function() { // add
                try {
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }     
            });
        });
    }
    
    if (self.status === REJECTED) {
        return  promise2 = new Promise(function(resolve, reject) {
            setTimeout(function() { // add
                try {
                    let x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }     
            });
        });
    }
}
```

### 测试promise A+规范

1. npm全局安装`promises-aplus-tests`库

```
npm i -g promises-aplus-tests
```

2. 在自己实现promise的js文件中暴露promise模块

```javascript
// 如果你自己实现的promise叫MyPromise 
// 则对应的代码就是
/**
 * MyPromise.defer = MyPromise.deferred = function() {
 *  let dfd = {};
 *  dfd.promise = new MyPromise((resolve, reject) => {
 *    dfd.resolve = resolve;
 *    dfd.reject = reject;
 *  });
 *  return dfd;
 * }
 * module.exports = MyPromise;
 */
Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}
module.exports = Promise;
```

3. 命令行在当前文件目录下键入测试命令

```
promises-aplus-tests 文件名.js
```

##### 通过创建package.json局部安装测试库

```
{
    "devDependencies": {
        "promises-aplus-tests": "*"
    },
    "scripts": {
        "test": "promises-aplus-tests 文件名.js"
    }
}
```
创建完成后，按照熟悉的前端跑项目流程即可：

```
npm i
npm run test
```

## 完整代码（新版）

```javascript
const STATUS = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  rejected: 'rejected',
}

class Promise {
  constructor(excutor) {
    this.status = STATUS.pending;
    this.onFinishCb = [];
    const resolve = (value) => {
      if (value instanceof Promise) {
        return value.then(resolve, reject);
      }
      // When pending, a promise may transition to either the fulfilled or rejected state.
      if (this.status === STATUS.pending) {
        this.status = STATUS.fulfilled;
        this.value = value;
        // f/when promise is fulfilled, all respective onFulfilled callbacks must execute in the order of their originating calls to then
        this.onFinishCb.forEach(cbObj => cbObj.onFullfilled(this.value));
      }
    };
    const reject = (reason) => {
      // When pending, a promise may transition to either the fulfilled or rejected state.
      if (this.status === STATUS.pending) {
        this.status = STATUS.rejected;
        this.reason = reason;
        // If/when promise is rejected, all respective onRejected callbacks must execute in the order of their originating calls to then
        this.onFinishCb.forEach(cbObj => cbObj.onRejected(this.reason));
      }
    };
    try {
      excutor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  let isCalled = false;
  // If promise and x refer to the same object, reject promise with a TypeError as the reason.
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
    // If x is a promise, adopt its state 走else分支 交给resolve函数处理
    // Otherwise, if x is an object or function
  } else if (typeof x === 'function' || (x && typeof x === 'object')) {
    // If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
    try {
      // Let then be x.then
      let then = x.then;
      // If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise
      if (typeof then === 'function') {
        // If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
        const resolvePromiseFn = function (y) {
          // If both resolvePromise and rejectPromise are called,
          // or multiple calls to the same argument are made,
          // the first call takes precedence,
          // and any further calls are ignored.
          if (isCalled) {
            return;
          }
          isCalled = true;
          resolvePromise(promise2, y, resolve, reject);
        };
        // If/when rejectPromise is called with a reason r, reject promise with r.
        const rejectPromiseFn = function (r) {
          // If both resolvePromise and rejectPromise are called,
          // or multiple calls to the same argument are made,
          // the first call takes precedence,
          // and any further calls are ignored.
          if (isCalled) {
            return;
          }
          isCalled = true;
          reject(r);
        };
        then.call(x, resolvePromiseFn, rejectPromiseFn);
      } else {
        // If then is not a function, fulfill promise with x.
        resolve(x);
      }
    } catch (e) {
      // If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
      // If calling then throws an exception e, If resolvePromise or rejectPromise have been called, ignore it. Otherwise, reject promise with e as the reason.
      if (!isCalled) {
        reject(e);
      }
      isCalled = true;
    }
  } else {
    // If x is not an object or function, fulfill promise with x.
    resolve(x);
  }
}

Promise.prototype.then = function (onFullfilled, onRejected) {
  let promise2;
  let _this = this;
  // If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.
  onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : value => value;
  // If onRejected is not a function, promise2 must be rejected with the same reason as promise1.
  onRejected = typeof onRejected === 'function' ? onRejected : reason => {
    throw reason;
  };
  if (this.status === STATUS.fulfilled) {
    // onFullfilled(this.value);
    // onFulfilled and onRejected must be called as functions (i.e. with no this value).
    promise2 = new Promise(function (resolve, reject) {
      // onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
      /**
       * Here “platform code” means engine, environment,
       * and promise implementation code. In practice,
       * this requirement ensures that onFulfilled and onRejected execute asynchronously,
       * after the event loop turn in which then is called, and with a fresh stack.
       * This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate,
       * or with a “micro-task” mechanism such as MutationObserver or process.nextTick.
       * Since the promise implementation is considered platform code,
       * it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.
       */
      setTimeout(function () {
        // If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
        try {
          // If either onFulfilled or onRejected returns a value x,
          const x = onFullfilled(_this.value);
          // run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
  } else if (this.status === STATUS.rejected) {
    // onRejected(this.reason);
    // onFulfilled and onRejected must be called as functions (i.e. with no this value).
    promise2 = new Promise(function (resolve, reject) {
      // onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
      setTimeout(function () {
        // If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
        try {
          // promise1 is rejected, promise2 must be rejected with the same reason as promise1.
          // If either onFulfilled or onRejected returns a value x,
          const x = onRejected(_this.reason);
          // run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
  } else if (this.status === STATUS.pending) {
    // onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
    // 因此仍在pending时需要封装一个回调
    // this.onFinishCb.push({
    //   onFullfilled,
    //   onRejected,
    // });
    // onFulfilled and onRejected must be called as functions (i.e. with no this value).
    promise2 = new Promise(function (resolve, reject) {
      _this.onFinishCb.push({
        onFullfilled: function (value) {
          // onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
          setTimeout(() => {
            // If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
            try {
              const x = onFullfilled(value);
              // run the Promise Resolution Procedure [[Resolve]](promise2, x).
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        },
        onRejected: function (reason) {
          // onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
          setTimeout(() => {
            // If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
            try {
              const x = onRejected(reason);
              // run the Promise Resolution Procedure [[Resolve]](promise2, x).
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        },
      });
    });
  }
  // then must return a promise. promise2 = promise1.then(onFulfilled, onRejected);
  return promise2;
};

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

Promise.resolve = function (v) {
  if (v instanceof Promise) {
    return v;
  }
  return new Promise(function (resolve) {
    resolve(v);
  });
};

Promise.reject = function (v) {
  return new Promise(function (_, reject) {
    reject(v);
  });
};

Promise.all = function (iterable) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(iterable)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }
    var arrs = [...iterable];
    var results = new Array(arrs.length);
    var handlingCount = arrs.length;
    if (!handlingCount) {
      resolve(results);
    } else {
      function resolvePromise(i, val) {
        if (val && val.then && typeof val.then === 'function') {
          let then = val.then;
          then.call(
            arrs[i],
            function (v) {
              // 如果回来的v仍然是个promise
              resolvePromise(i, v)
            },
            reject,
          )
        } else {
          results[i] = val;
          if (--handlingCount === 0) {
            resolve(results);
          }
        }
      }
      arrs.forEach((arr, i) => {
        resolvePromise(i, arr);
      });
    }
  });
};

Promise.race = function (iterable) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(iterable)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }
    iterable.forEach(eachMember => {
      Promise.resolve(eachMember).then(resolve, reject);
    });
  });
}
```