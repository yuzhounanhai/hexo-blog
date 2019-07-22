---
title: 深入了解AJAX
categories:
- 前端
tags:
- http
- JS
---

AJAX允许浏览器在无需刷新的情况下，异步的更新界面。

## AJAX的特点

+ 无刷新的更新数据

+ 与服务器进行异步通信

+ 破坏了浏览器机制
    在无刷新更新页面数据的情况下，用户无法返回上一个页面状态，因为浏览器仅能记忆历史记录中的静态页面。

+ 安全问题
    伪造AJAX请求的方式引发了一定的安全问题，不要认为每个请求都是真实合理的，例如用户可以自行发送AJAX请求到服务器端，从而绕过前端的数据检查。针对这一问题，需要在服务器端保留数据的逻辑验证。其次的安全问题一般有sql注入、跨站信息伪造等等。
<!-- more -->
## AJAX通信原理

AJAX是使用XMLHttpRequest对象发送http请求并接收响应。XMLHttpRequest是一个JS对象，可以使用JS对象的方法与事件。

## AJAX浏览器兼容性

AJAX浏览器兼容性表现在IE浏览器和其他浏览器对XMLHttpRequest这个对象的实现上。

IE浏览器: ActiveXObject('Microsoft.XMLHTTP')
其他浏览器: XMLHttpRequest

## AJAX规范
AJAX规范共分为两级。

![ajax规范等级](/images/20190703/ajax_level.png)

AJAX一级存在着一些限制：

1. 受同源策略限制，不允许发送跨域请求；

2. 只能发送文本数据；

3. 无法获得进度信息，只能知晓AJAX请求是否完成。

AJAX二级优化了一级时存在的限制，同时新增了两个功能。

1. 允许发送跨域请求，将是否接收跨域请求交由服务器端判定;

2. 除原本支持的文本数据外，还允许发送二进制数据（具体表现在图片、视频、音频上）；

3. 解决了无法获得AJAX进度的问题。

4. 新增formData对象，允许发送表单数据；

5. 可以设置请求超时的超时时长。


## AJAX通信流程

![ajax通信流程](/images/20190703/ajax_step.png)

AJAX的通信可以分为发送、监听、接收服务器响应数据三大步骤。

1. 发送

这个阶段向服务器发起请求，请求的类型有GET\POST\HEAD\DELETE等。请求的同时会携带数据进行发送。

2. 监听

发送请求后，AJAX处理器将进入监听状态，等待来自服务器的响应。

3. 接收响应

服务器一旦响应，意味着服务器端将告知本次AJAX请求处理后的结果，例如这是一个查询请求，那么服务器端响应的将是本次查询的结果；或者这是一个删除操作请求，那么服务器端响应的将是本次删除操作是否成功的一个结果。

AJAX处理器将接收这个结果。


## AJAX请求的连接状态
XMLHttpRequest对象的readyState记录了AJAX请求的连接状态。它有五个属性值：

值|含义
:--:|:--:
0|未打开，请求未初始化
1|未发送，但服务器连接已经建立
2|请求已经接收，响应头和响应状态已经返回
3|请求处理，主要任务是下载响应体，此时responseText中已有部分内容
4|请求已完成，整个请求过程已经完毕


## XHR对象触发事件顺序
#### XHR部分代码实现
```java
interface XMLHttpRequestEventTarget : EventTarget {
	// event handlers
	attribute EventHandler onloadstart;
	attribute EventHandler onprogress;
	attribute EventHandler onabort;
	attribute EventHandler onerror;
	attribute EventHandler onload;
	attribute EventHandler ontimeout;
	attribute EventHandler onloadend;
};

interface XMLHttpRequestUpload : XMLHttpRequestEventTarget {

};

interface XMLHttpRequest : XMLHttpRequestEventTarget {
	// event handler
	attribute EventHandler onreadystatechange;
	readonly attribute XMLHttpRequestUpload upload;
};
```
代码分析：
+ onreadystatechange是XMLHttpRequest独有的事件
+ XMLHttpRequest与XMLHttpRequestUpload都继承自XMLHttpRequestEventTarget，因此除了xhr之外，xhr内部定义的upload属性也具备XMLHttpRequestEventTarget所定义的七个事件。

#### XHR对象事件归纳
由XHR接口的代码实现分析可得，XHR对象事件共包括以下几个：

1. XHR自带事件
    + xhr.onreadystatechange

2. XHR继承事件
    + xhr.onloadstart
    + xhr.onprogress
    + xhr.onload
    + xhr.onloadend
    + xhr.onabort
    + xhr.onerror
    + xhr.ontimeout

3. XHR自带属性upload事件
    + xhr.upload.onloadstart
    + xhr.upload.onprogress
    + xhr.upload.onload
    + xhr.upload.onloadend
    + xhr.upload.onabort
    + xhr.upload.onerror
    + xhr.upload.ontimeout

#### 事件触发条件

事件|触发条件
:--|:--
xhr.onreadystatechange|每当xhr.readyState改变时触发；但xhr.readyState由非0值变为0时不触发。
xhr.onloadstart|调用xhr.send()方法后立即触发，若xhr.send()未被调用则不会触发此事件。
xhr.upload.onprogress|在上传阶段，即xhr.send()之后，xhr.readystate=2之前触发，每50ms触发一次。
xhr.onprogress|在下载阶段，即xhr.readystate=3时触发，每50ms触发一次。
xhr.onload|当请求成功完成时触发，此时xhr.readystate=4
xhr.onloadend|当请求结束（包括请求成功和请求失败）时触发
xhr.onabort|当调用xhr.abort()后触发
xhr.ontimeout|xhr.timeout不等于0，由请求开始即onloadstart开始算起，当到达xhr.timeout所设置时间请求还未结束即onloadend，则触发此事件。
xhr.upload.onerror|若发生网络错误时，上传还没有结束，则会先触发该事件。
xhr.onerror|1. 在触发xhr.upload.onerror后，会触发xhr.onerror2. 若发生网络错误时，上传已经结束，则只会触发xhr.onerror3. 当且仅当发生网络错误时才会触发此事件，应用层错误（如状态码返回4XX）不会触发该事件。

#### 正常请求事件触发顺序

![ajax事件触发顺序](/images/20190703/ajax_status_step.png);

当请求一切正常时，相关的事件触发顺序如下：

1. 触发xhr.onreadystatechange(之后每次readyState变化时，都会触发一次)

2. 触发xhr.onloadstart

--上传阶段开始--

3. 触发xhr.upload.onloadstart

4. 触发xhr.upload.onprogress

5. 触发xhr.upload.onload

6. 触发xhr.upload.onloadend

--上传结束，下载阶段开始--

7. 触发xhr.onprogress

8. 触发xhr.onload

9. 触发xhr.onloadend

#### 异常请求事件顺序

一旦发生abort或timeout或error异常：

1. 先立即中止当前请求

2. 将 readystate 置为4，并触发xhr.onreadystatechange事件

如果上传阶段还没有结束，则依次触发以下事件：

1. xhr.upload.onprogress

2. xhr.upload.[onabort或ontimeout或onerror]

3. xhr.upload.onloadend

4. 触发xhr.onprogress事件

5. 触发xhr.[onabort或ontimeout或onerror]事件

6. 触发xhr.onloadend事件

## XHR对象常用属性

#### xhr.readyState
XHR对象的状态，共有0-4五个值，分别表示XHR对象处于何种状态。

#### xhr.status
服务器返回的状态码，即响应结果码，例如200（ok）、404（not found）等。

#### xhr.statusText
服务器返回的状态文本，一般是状态码的含义，如ok、not found等。

#### xhr.responseText
服务器返回的文本数据。

#### xhr.responseXML
服务器返回的XML数据。

## XHR对象常用方法
#### xhr.abort();
如果请求已经被发送,则立刻中止请求。

#### xhr.open(method,url, async, user, password);
建立一个连接。

#### xhr.setRequestHeader(label,value);
设置请求头，需要在send之前进行设置。

#### xhr.send(content);
content只有在post请求时才生效。该方法用以发送请求。

#### xhr.getResponseHeader(headerName);
根据headerName值获得指定响应头。

#### xhr.getAllResponseHeader();
获得所有响应头。

## 参考资料
> 1、聊聊Ajax那些事——铁狮子
> https://segmentfault.com/a/1190000006669043
> 2、你真的会使用XMLHttpRequest吗？——WEB前端路上踩过的坑儿
> https://segmentfault.com/a/1190000004322487
> 3、XMLHttpRequest Level2 使用指南——阮一峰的网络日志
> http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html