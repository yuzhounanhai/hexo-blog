---
title: 原生API的实现
categories:
- 前端
tags:
- 原理
- JS
---
实现 call\apply\async
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