---
title: 跨域、跨站Cookie的简单理解
categories:
- HTTP
tags:
- HTTP
- 跨站
- 跨域
- Cookie
---

本文将对跨域/跨站Cookie的相关知识点做一个简单的理解性质的总结梳理.

## 前端跨域

浏览器的`同源策略`是导致前端出现跨域问题的主要原因.

#### 什么是同源策略

同源策略是指在Web浏览器中，允许某个网页脚本访问另一个网页的数据，但前提是这两个网页必须有相同的URI、主机名和端口号，一旦两个网站满足上述条件，这两个网站就被认定为具有相同来源。此策略可防止某个网页上的恶意脚本通过该页面的文档对象模型访问另一网页上的敏感数据。

同源策略对Web应用程序具有特殊意义，**因为Web应用程序广泛依赖于HTTP cookie来维持用户会话，所以必须将不相关网站严格分隔，以防止丢失数据泄露**。

值得注意的是同源策略**仅适用于脚本**，这意味着某网站可以通过相应的HTML标签访问不同来源网站上的图像、CSS和动态加载脚本等资源。而**跨站请求伪造就是利用同源策略不适用于HTML标签的缺陷**。

#### 同源的严格条件

同源策略认定, 在同源策略生效场景下, 若不满足以下任意一个条件, 则非同源, 即跨域:

1. 相同**协议**
2. 相同**域名**(域名完全匹配, 子域A到子域B也不满足这一条件)
3. 相同**端口**

<!-- more -->

相关示例如下:

URL|结果|原因
:--:|:--:|:--:
http://www.example.com/dir/page2.html|是|只有路径不同
http://www.example.com/dir2/other.html|是|只有路径不同
http://username:password@www.example.com/dir2/other.html|是|只有路径不同
http://www.example.com:81/dir/other.html|否|不同端口（若未标明，http:// 默认端口号为80）
https://www.example.com/dir/other.html|否|不同协议（https和http）
http://en.example.com/dir/other.html|否|不同域名
http://example.com/dir/other.html|否|不同域名（需要完全匹配）
http://v2.www.example.com/dir/other.html|否|不同域名（需要完全匹配）

## 跨域解决方式: 跨源资源共享(CORS)

前端解决跨域有很多方式, 如JsonP/WebSocket等, 其中最简单的方式是 `CORS`.

前端浏览器将默认支持`CORS`(部分低版本浏览器, 如IE8/9浏览器需要前端进行兼容性解决), 也就是说实现 `CORS` 的关键是后端. 只要后端实现了 `CORS`, 就实现了跨域.

#### 后端如何实现 `CORS`

简单来说, 只需要后端在响应时, 传递 `Access-Control-Allow-Origin` 响应头, 并将请求发送域添加至 `Access-Control-Allow-Origin` 的响应内容中, 即可实现.

与之有关的仍然有一批响应头, 如 `Access-Control-Allow-Methods` `Access-Control-Allow-Headers` 等, 一般用于加强约束请求的合法性, 由于本文仅作简单理解, 暂不做扩展展开.

#### 为什么前端提示跨域并报错, 后端仍然接受到了请求?

简单来说, 对于跨域请求, 浏览器总是先向服务器发送请求, 随后根据相关协议判断是否拦截该请求的响应至业务逻辑中.

复杂一点说, 对于一个请求, 浏览器会根据这一请求的请求头、请求方法等内容来判定这一请求是一简单请求或是一个复杂请求. 
+ 对于简单请求直接发送请求, 并根据响应与相关协议处理响应拦截问题
+ 对于复杂请求, 浏览器会发送一个"预检"请求(Option请求), 根据"预检"请求的响应来决定是否发送实际的复杂请求

#### 简单请求与复杂请求的判定

> 本文仅做简单场景理解, 详情可查看下方链接
> https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS


## 跨站Cookie

在本篇开始之前, 我需要明确几个说法, 在后续碰到相关阐述时, 可以参照这一解释:

+ 同源: 即协议\域名\端口都一致
+ 同站: http://image.baidu.com 与 https://www.baidu.com 属于同站, 即主域相同
+ 同一个站点: 意思更倾向于同源, 表示仅一个站点
+ 跨站: 主域不同即跨站, 二级域不同不算跨站, 跨站一定是跨域
+ 跨域: 协议\域名\端口任一不一致, 即跨域

#### Cookie

Cookie 有以下基本属性, 可以在响应头中, 通过 `Set-Cookie` 响应头设置以下属性来设置对应Cookie:

+ <cookie-name>=<cookie-value>: 名称/值对
+ Expires=<date>: 过期时间
+ Max-Age=<non-zero-digit>: 相对过期时间, 优先级比Expires更高
+ Domain=<domain-value>: 指定 cookie 可以送达的主机名。假如没有指定，那么默认值为当前文档访问地址中的主机部分（但是不包含子域名）。
+ Path=<path-value>: 指定一个 URL 路径, 一般为"/"
+ Secure: 一个带有安全属性的 cookie 只有在请求使用SSL和HTTPS协议的时候才会被发送到服务器。
+ HttpOnly: 设置了 HttpOnly 属性的 cookie 不能使用 JavaScript 经由  Document.cookie 属性、XMLHttpRequest 和  Request APIs 进行访问，以防范跨站脚本攻击（XSS）。
+ SameSite=None|Strict|Lax: 跨站Cookie设定, 控制该cookie是否在跨站时, 是否被发送.

#### XMLHttpRequest.withCredentials

布尔值, 默认值为false.

一般用于处理**跨域**场景下Cookies的控制, 不会影响到**同源**场景下的请求.

对于不同域(**跨域**)下的响应, 无论 `Access-Control-` 响应头如何设置, 只要在请求发送时, `XMLHttpRequest.withCredentials` 设置为false, 那么该请求中的 `Set-Cookie` 响应头, 都无法为该请求域设置Cookies, 浏览器也不会对**跨站**请求自动携带Cookie.

**跨域**情况下, 即便`XMLHttpRequest.withCredentials` 设置为true, 由于同源策略影响, 程序自身也无法通过`document.cookie`或者通过脚本从响应头部获取响应头等方式访问这一Cookie.

#### 不同场景下Cookie的传递情况

1. 同源/同站

基本情况:
`a.example.com` 下存在Cookie `aCookie`
`b.example.com` 下存在Cookie `bCookie`
存在 Cookie `ck`, `domain` 属于 `.example.com`

控制台表现:
我们在 `a.example.com` 网页下的浏览器控制台中查看Cookie情况, 无法看到 `b.example.com` 的Cookie, 但是可以看到 `a.example.com` 的Cookie 与 `domain` 在 `.example.com` 下的Cookie. 即可以看到 `aCookie` 和 `ck`.
同理, 在 `b.example.com` 网页下的浏览器控制台能看到 `bCookie` 和 `ck`

实际表现:

+ `a.example.com` 请求 `a.example.com/api`: 属于同源, 不存在任何限制, 请求浏览器会主动携带Cookie

+ `b.example.com` 请求 `b.example.com/api`: 同上

+ `a.example.com` 请求 `b.example.com/api`: 不同源但同站, 存在限制, 需要前端请求设置 `XMLHttpRequest.withCredentials = true`; 才会携带cookie

+ `b.example.com` 请求 `a.example.com/api`: 同上

2. 跨站

基本情况:

`a.example.com` 下存在Cookie `aCookie`
`c.test.com/api` 的一个接口会通过 `Set-Cookie` 响应头注入一个名为 `cCookie` 的Cookie
`c.test.com/api` 的其他接口需要 `cCookie` 作为凭证

历史表现:

**在浏览器未引入新机制时**, 需要前端请求设置 `XMLHttpRequest.withCredentials = true`; 此时 `Set-Cookie` 才会生效, 并将 `cCookie` 设置在 `c.test.com` 域名下, 在后续其他接口的请求中, 同样需要设置 `XMLHttpRequest.withCredentials = true` 才会携带 `cCookie`, 但不会携带 `aCookie`


#### SameSite

MDN 英文版中有如下说明:

> Browsers are migrating to have cookies default to SameSite=Lax. If a cookie is needed to be sent cross-origin, opt out of the SameSite restriction using the None value. The None value requires the Secure attribute.

这个说明表示, 浏览器正在将 `SameSite` 的默认值设置为 `Lax`, 如若需要跨域(其实是跨站)发送 `Cookie`, 请设置 `None` 值选择退出 `SameSite` 限制. 设置为 `None` 值后需要同时设置 `Secure` 才会生效.

这意味着, 对于跨站的请求, 即便前端设置了 `XMLHttpRequest.withCredentials = true`, 那么是否发送 Cookie 还将取决于浏览器中 `Cookie` 的 `SameSite` 属性.

请求类型|实例|以前|Strict|Lax|None
:--:|:--:|:--:|:--:|:--:|:--:
链接|``<a href="..."></a>``|发送 Cookie|不发送|发送 Cookie|发送 Cookie
预加载|``<link rel="prerender" href="..."/>``|发送 Cookie|不发送|发送 Cookie|发送 Cookie
GET 表单|``<form method="GET" action="...">``|发送 Cookie|不发送|发送 Cookie|发送 Cookie
POST 表单|``<form method="POST" action="...">``|发送 Cookie|不发送|发送 Cookie|不发送
iframe|``<iframe src="..."></iframe>``|发送 Cookie|不发送|发送 Cookie|不发送
AJAX|``$.get("...")``|发送 Cookie|不发送|发送 Cookie|不发送
Image|``<img src="...">``|发送 Cookie|不发送|发送 Cookie|不发送

从上表关系可以得出, 严格模式完全禁止了第三方Cookie, Lax则相对放松, 而None的情况, 与浏览器未将默认值改变时的表现一致.

#### SameSite的可用性与兼容性

1. 设置了 `SameSite` 为 `None` 后, 需要同时指定 `Secure` 属性, 这意味着, 你的网站需要支持 HTTPS
2. SameSite 为其他属性时, 不需要指定 `Secure`

部分浏览器会错误的识别 `SameSite=None;`, 比如 iOS12 的 Safari, 51-66版本的Chrome浏览器, 这些浏览器可能会忽视这一属性, 也可能会将 None 识别为最高级别的 Strict, 也有可能将整条 Cookie 认定为无效

> 查看 https://www.chromium.org/updates/same-site/incompatible-clients 了解更多
> + Versions of Chrome from Chrome 51 to Chrome 66 (inclusive on both ends). These Chrome versions will reject a cookie with `SameSite=None`. This also affects older versions of Chromium-derived browsers, as well as Android WebView. This behavior was correct according to the version of the cookie specification at that time, but with the addition of the new "None" value to the specification, this behavior has been updated in Chrome 67 and newer. (Prior to Chrome 51, the SameSite attribute was ignored entirely and all cookies were treated as if they were `SameSite=None`.)
> + Versions of UC Browser on Android prior to version 12.13.2. Older versions will reject a cookie with `SameSite=None`. This behavior was correct according to the version of the cookie specification at that time, but with the addition of the new "None" value to the specification, this behavior has been updated in newer versions of UC Browser.
> + Versions of Safari and embedded browsers on MacOS 10.14 and all browsers on iOS 12. These versions will erroneously treat cookies marked with `SameSite=None` as if they were marked `SameSite=Strict`. This bug has been fixed on newer versions of iOS and MacOS.

因此, 若要使用 SameSite 属性, 需要对 userAgent 进行处理, 智能的决定是否添加 SameSite 属性.

## 前端安全 CSRF 跨站请求伪造

之所以浏览器要对Cookie做出这么多的限制, 主要是为了防止一些常见的前端攻击方式.

跨站请求伪造（CSRF）是一种冒充受信任用户，向服务器发送非预期请求的攻击方式。

举例来说:

假如一家银行用以运行转账操作的URL地址如下： https://bank.example.com/withdraw?account=AccoutName&amount=1000&for=PayeeName

那么，一个恶意攻击者可以在另一个网站上放置如下代码：
```<img src="https://bank.example.com/withdraw?account=Alice&amount=1000&for=Badman" />```

如果有账户名为Alice的用户访问了恶意站点，而她之前刚访问过银行不久，登录信息尚未过期，那么她就会损失1000资金。

这种恶意的网址可能有很多形式, 例如藏身论坛, 博客等任何用户生成内容的网站中. 这意味着**如果服务端没有合适的防御措施的话，用户即使访问熟悉的可信网站也有受攻击的危险。**

这种方式, 攻击者并不能利用 CSRF 攻击直接获取用户的账户控制权, 也不能直接窃取用户的任何信息, 他们能做的, 是欺骗用户的浏览器, 让浏览器以用户的名义去运行操作.

因此浏览器对于自动携带请求域下的 Cookie 做出了严格的限制, 从浏览器层面减少 CSRF 发生的可能.


## 参考链接

1. 同源策略-维基百科 https://zh.wikipedia.org/wiki/%E5%90%8C%E6%BA%90%E7%AD%96%E7%95%A5
2. CORS-MDN https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS
3. Set-Cookie-MDN https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie
4. XMLHttpRequest.withCredentials-MDN https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials
5. Cookie 的 SameSite 属性-阮一峰的网络日志 http://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html
6. 跨站请求伪造-维基百科 https://zh.wikipedia.org/wiki/%E8%B7%A8%E7%AB%99%E8%AF%B7%E6%B1%82%E4%BC%AA%E9%80%A0
7. SameSite小识-掘金 https://juejin.im/post/6844904110454472711