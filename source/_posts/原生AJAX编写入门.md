---
title: 原生AJAX编写入门
---

AJAX（Asynchronous Javascript And XML，异步Javascript和XML）是一种无需重新加载整个网页的情况下，能够更新部分网页的技术。

AJAX是通过核心对象XMLHttpRequest，使用Javascript向服务器提出请求，并处理响应。

## AJAX请求分析

一般的，我们在AJAX的使用上，习惯性的将请求链接、请求方法、回调函数等封装成一个对象，若AJAX请求成功，将触发对象中的成功回调函数。即我们的使用是这样的：
<!-- more -->
```javascript
ajax({
    url: "http://...",
    type: 'GET',
    data: {
        id: '12345',
        otherData: 'some-data'
    },
    success: function (data) {
        //function body
    },
    erro: function (erroMessage) {
        //function body
    }
});
```

由上述代码可得，我们将接受的形参，是一个对象。

其次，AJAX内部的简单逻辑可以分为以下几个步骤

1. 得到形参中必要的请求数据：如请求链接、请求类型、数据等；

2. 实例化XMLHttpRequest对象；

3. 分类型进行AJAX请求（本文主要区分GET/POST）；

4. 请求回调 。

```javascript
var ajax = function(param){
    //解析param对象，获得必要参数

    //实例化XMLHttpRequest

    //分类型进行AJAX请求

    //请求回调
}
```

## 解析param对象

由上一步分析可得，param对象中封装了请求链接、请求方式、数据、回调函数等，解析param对象，也就是读取param对象中各个属性对应的值。可以直接通过`对象.属性名`来访问，同理也可以使用`对象[属性名]`。

#### 哪些数据是必要呢？

+ 请求链接url是必要的，没有url则无法知晓往哪里发送请求。由此可以得到逻辑：url不存在，需要直接return；

+ 请求方式是必要的，若param对象中不存在请求方式，可以人为规定使用GET方式；

+ 数据不是必要的，这需要根据后端所暴露出的接口分情况讨论，但若存在数据，则需要对其进行处理；

+ 回调函数不是必要的，回调函数的存在与否不会影响到ajax请求的发送，它只是作为请求结束时的一种异步的解决方案。

因此在这一步，我们将针对前三条逻辑，进行代码的实现：

```javascript
// url必要
var url = param.url;
if (!url) {
    return ;
}
// 请求方式必要
/*
* param.type如果存在则使用param.type值，
* 否则使用'get'，请求类型需要大写（GET/
* POST），所以进行转换。
*/
var type = (param.type || 'get').toUpperCase();
// 数据处理
var data = param.data,
    dataArr = [];
for(var k in data){
    // 键=值的形式存入数组
    dataArr.push(k + "=" + data[k]);
}
```

### 实例化XMLHttpRequest对象

XMLHttpRequest存在兼容性问题，因此需要做兼容性适配。

``` javascript
// 若XMLHttpRequest存在，则实例化一个XMLHttpRequest对象
var xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
```

## 分类型请求（GET、POST）

#### get和post

HTTP方法中常见的有get、post、put、delete、head，这五个方法分别应用在不同的场景，而在五个方法中最为常见的是GET和POST两个方法。

区别: GET和POST最明显可见的区别，就在传输方式和安全性上。具备一定知识的同学一定知道，GET方法会将参数、数据暴露在url地址栏上，POST则将数据传入请求体中；其次在安全性上post会比get安全的多。

其实这两点已经是最为主要的区别了，更多的区别则在于这两点的拓展上：

+ GET在浏览器回退时是无害的，POST则会再次发送请求；

+ GET产生的URL可以收藏，POST不可以；

+ GET请求会被浏览器主动缓存，POST需手动设置；

+ GET请求只支持url编码，POST支持多种编码方法；

+ GET请求的参数会被保存在历史记录中（URL保存在历史记录中），POST的参数不会保留；

+ GET请求在URL中传送的参数有限制（其实是URL长度有限制），POST没有限制；

+ GET请求只接受ASCII字符，POST可接受有数据类型的参数；

+ GET请求参数通过URL传递，POST则放置在Request Body中；

+ POST比GET安全，因为GET请求的参数直接暴露在URL上，所以不能放置敏感信息，如密码等。


#### xhr.open(method, url, async)

+ method：string，请求方式：'GET'/'POST'；

+ url：string，请求地址；

+ async：boolean，是否异步请求：true/false。

#### xhr.setRequestHeader(header, value);

设置请求头。

+ header：请求头名；

+ value：该请求头所对应的值。

#### xhr.send(message)

+ message：仅当POST请求时可用。

#### 实现

使用if-else分支实现分类型请求。

一般的AJAX请求

如果是get请求，则需要拼接url地址，即拼接成 http://.....?属性1=值&属性2=值 这种形式，然后发送；如果是post请求，则需要将数据包含在request body中。

```javascript
if('GET' == type){
    url = url + dataArr.join('&');
    xhr.open(type, url);
    xhr.send();
} else {
    xhr.open(type, url);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencode");
    xhr.send(dataArr.join('&'));
}
```

## 请求回调

xhr.onload提供了xhr请求结束时的相关操作。在这一阶段，进行事件回调。
``` javascript
xhr.onload = function(){
    // 返回的http状态码为200即http请求为ok
    if(xhr.status === 200){
        var res;
        // 如果存在param.success并且是函数
        if(param.success && param.success instanceof Function){
            res = xhr.responseText;
            if(typeof res === 'string'){
                res = JSON.parse(res);
                param.success.call(xhr, res);
            }
        }
    }
}
```

## 错误回调

造成错误的情况有：

+ 服务器明确返回错误状态码
+ timeout（没有接到响应）
+ 跨域（请求没有发出）
+ 其他情况

在明确接到错误状态码如500等，此时错误的回调应该在`onload`中进行调用，而跨域这一种请求没有发出便已经被浏览器拦截的则是在`onerror`中进行回调。

```javascript
xhr.onload = function () {
    var res;
    if (xhr.status === 200) {
        // ...
    } else {
        if (param.fail && param.fail instanceof Function) {
            res = xhr.responseText;
            var info = {
                errorCode: xhr.status,
                errorText: xhr.responseText
            };
            param.fail.call(xhr, info);
        }
    }
};
xhr.onerror = function () {
    if (param.fail && param.fail instanceof Function) {
        param.fail.call(xhr, {
            errorText: xhr.responseText
        });
    }
};
```


六、完整代码

```javascript
var ajax = function (param) {
    var url = param.url;
    if (!url) {
        return;
    }
    var type = (param.type || "get").toUpperCase(),
        data = param.data,
        dataArr = [];
    if (data && type === 'GET') {
        for (var k in data) {
            dataArr.push(k + "=" + data[k]);
        }
    }
    var xhr = XMLHttpRequest ?
        new XMLHttpRequest() :
        new ActiveXObject("Microsoft.XMLHTTP");
    if ("GET" === type) {
        url += "?" + dataArr.join("&");
        xhr.open(type, url);
        // 允许跨域
        xhr.withCredentials = true;
        xhr.send();
    } else {
        xhr.open(type, url);
        // 允许跨域
        xhr.withCredentials = true;
        // 一些requestHeader的处理
        // if (!(data instanceof FormData)) {
        //     xhr.setRequestHeader("content-type", param.contentType || "application/json");
        // }
        xhr.send(data);
    }
    xhr.onload = function () {
        var res;
        if (xhr.status === 200) {
            if (param.success && param.success instanceof Function) {
                res = xhr.responseText;
                if (typeof res === "string") {
                    try {
                        param.success.call(xhr, JSON.parse(res));
                    } catch (e) {
                        param.success.call(xhr, res);
                    }
                }
            }
        } else {
            if (param.fail && param.fail instanceof Function) {
                res = xhr.responseText;
                var info = {
                    errorCode: xhr.status,
                    errorText: xhr.responseText
                };
                param.fail.call(xhr, info);
            }
        }
        if (param.complete && param.complete instanceof Function) {
            param.complete.call(xhr);
        }
    };
    xhr.onerror = function () {
        if (param.fail && param.fail instanceof Function) {
            param.fail.call(xhr, {
                errorText: xhr.responseText
            });
        }
        if (param.complete && param.complete instanceof Function) {
            param.complete.call(xhr);
        }
    };
    xhr.onprogress = function (e) {
        if (param.progress && param.progress instanceof Function) {
            param.progress.call(xhr, e);
        }
    };
};
```