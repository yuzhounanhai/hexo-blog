---
title: 浅析Redux实现原理
---

*本文整理自 [React状态管理与同构实战](http://www.broadview.com.cn/book/5012) 一书，部分内容略有不同。若您对更多内容感兴趣，可以尝试购买。*

如若你还不了解 Redux 的一些基本要素，你可以去阅读我的 [初识Redux](https://yuzhounanhai.github.io/2019/07/13/%E5%88%9D%E8%AF%86Redux/) 一文。

## Store 的实现

Store 不是类。它只是有几个方法的对象。这些方法在 [初识Redux](https://yuzhounanhai.github.io/2019/07/13/%E5%88%9D%E8%AF%86Redux/) 一文中有介绍过。（你也可以去阅读 Redux 文档中关于 Store 的定义，点击 [这里](https://www.redux.org.cn/docs/api/Store.html) ）

```javascript
store = (
    dispatch,
    getState,
    subscribe,
    replaceReducer
}
```

我们使用 `createStore()` 这一个 API 来创建 store 对象，因此我们将从这个方法入手。（[阅读 createStore API](https://www.redux.org.cn/docs/api/createStore.html)）关于 `createStore()` 方法的定义如下：

<!-- more -->

```
createStore(reducer, [preloadedState], enhancer)
```

preloadedState 是初始时的 state；enhancer 是一个组合 store creator 的高阶函数，返回一个新的强化过的 store creator；这一部分我暂时不涉足，目前将只考虑 reducer 传入的情况。因此我们可以定义一个函数：

```javascript
const createStore = (reducer) => {
    // do something...
}
```

由于 store 实例会持有当前 store 所保存的状态，因此可以通过一个变量 `state` 来保存状态。

```javascript
const createStore = (reducer) => {
    let state;
    // do something...
}
```

该方法将返回一个 store 实例，而 store 实例是包含四个重要方法的对象(这边暂时不讨论 `replaceReducer` 的内容)。因此需要增加以下代码：

```javascript
const createStore = (reducer) => {
    let state;
    
    const getState = () => state;

    const dispatch = (action) => {
        // do something...
    }

    const subscribe = (listener) => {
        // do something...
    }
    
    return {
        getState,
        dispatch,
        subscribe
    }
}
```

现在我们已经有了 `createStore()` 函数的基本雏形，可以发现，`dispatch()` 和 `subscribe()` 方法还没有实现完成。

实际上这两个函数完成的是一个 发布-订阅 模式：

+ `subscribe()` 将订阅者纳入管理
+ `dispatch()` 将通知所有的订阅者

根据上面的简要分析，因此在 `createStore()` 函数的闭包内，需要一个数组对这些订阅者进行管理。那么 `subscribe()` 和 `dispatch()` 方法的大约套路也能写出来：

```javascript
const createStore = (reducer) => {
    let state;
    let listeners = [];                 // add
    
    const getState = () => state;

    const dispatch = (action) => {
        // dispatch 会作为通知员，将 action 运送到 reducer 中。
        state = reducer(state , action);// add
        listeners.forEach(listener => { // add
            listener();                 // add
        });                             // add
    }

    const subscribe = (listener) => {
        listeners.push(listener);       // add
    }
    
    return {
        getState,
        dispatch,
        subscribe
    }
}
```

`subscribe()` 方法是具有返回值的。这个方法返回一个取消订阅的方法。因此要对 `subscribe()` 方法增加返回值：

```javascript
const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
        listeners.filter(item => item !== listener);
    }
}
```

至此就大致的完成了一个 store 的实现。

## combineReducers 的实现

你也可以先阅读一下 Redux 文档中关于 [combineReducers](https://www.redux.org.cn/docs/api/combineReducers.html) 这个 API 的描述定义。

`combineReducers` 是一个辅助函数，随着应用的日渐增长，将所有的 reducer 写在一份文件中，那么这个 reducer 函数将会变得难以维护。

`combineReducers` 辅助函数的作用是，把一个或多个不同 reducer 函数作为 value 的 object，合并成一个最终的 reducer 函数。

得益于 `combineReducers` 这个辅助函数，也就是说我们可以拆分 reducer 函数为多个 reducer 函数。在最终使用的时候，使用 `combineReducers` 辅助函数合并为一个 reducer 函数后，将该函数传递给 `createStore`。

具体使用如下：

```javascript
const rootReducer = combineReducers({
    potato: potatoReducer,
    tomato: tomatoReducer,
    todoApp: todoAppReducer 
});

function todoAppReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      })
    default:
      return state
  }
}
```

reducer 是一个函数，`combineReducers` 返回的是一个reducer，也就是说这个函数返回的是一个函数：

```javascript
const combineReducers = (reducers) => {
    return (state = {}, action) => {
        // do something...
    }
}
```

返回的函数需要对传入的 `reducers` 做出归一。这里我将采用 `reduce` 这个累加器的遍历方法(不了解？点击[这里](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce))

```javascript
const combineReducers = (reducers) => {
    return (state = {}, action) => {
        return Object.keys(reducers).reduce((prevState, curKey) => {
            return prevState[curKey] = reducers[curKey](
                state[curKey],
                action
            );
        }, {});
    }
}
```

## dispatch 改造 —— 实现记录日志

redux-logger 中间件使得每次派发 action 时，都可以通过 `console.log` 打印出相关信息， 方便我们更加清晰地认知 store state 每一步变更。

最直观的实现方式是在调用 `store.dispatch()` 的前后增加打印输出：

```javascript
console.log(action + "will dispatch");
console.log(store.getState());

store.dispatch(action);

console.log(action + "already dispatched");
console.log(store.getState());
```

但问题是我们不可能在代码中粗暴地加入零散琐碎的 `console.log`，而应通过扩展 `dispatch` 方法来实现。

我们创建一个名为 `addLoggingToDispatch` 的函数，取代默认的 `dispatch` 方法。

```javascript
const addLoggingToDispatch = store => {
    const rawDispatch = store.dispatch;
    
    return action => {
        // 按照 action 的类型进行分组
        console.group(action.type);
        // 输出更新前的 state
        console.log("previous state", store.getState());
        // 输出当前的 action
        console.log("action", action);

        // 调用默认的 dispatch 并记录返回值
        const returnValue = rawDispatch(action);

        // 输出更新后的 state
        console.log("next State", store.getState());
        // 结束分组
        console.groupEnd(action.type);

        return returnValue;
    }
}
```

最后我们也可以为这段代码加上环境判断，因为线上环境我们并不希望用户看到这些内容，因此线上环境使用默认的 `store.dispatch` 方法，而在其他环境，则使用带 log 的改造后的 dispatch 方法。

```javascript
if (process.env.NODE_ENV !== "production") {
    store.dispatch = addLoggingToDispatch(store);
}
```

## 识别 Promise

redux-thunk 中间件做了类似的工作，其原理是令 dispatch 接受一个函数，在这个函数中进行异步操作。

按照上一节添加日志的思路，我们也能较快的联想到以下解决办法：

1. 定义一个新的 `Dispatch` 方法 `addPromiseSupportToDispatch` 代替默认的 `Dispatch`。
2. 实现 `addPromiseSupportToDispatch`, 如若接受到的 action 是一个 promise，则在调用成功时执行 `dispatch` 方法。

```javascript
const isPromise = (func) => {
    if (func && typeof func.then === 'function' && typeof func.catch === 'function') {
        return true;
    }
    return false;
}
const addPromiseSupportToDispatch = store => {
    const rawDispatch = store.dispatch;
    return action => {
        if (isPromise(action)) {
            return action.then(rawDispatch);
        }
        return rawDispatch(action);
    }    
}

store.dispatch = addPromiseSupportDispatch(store);
```

## 糅合两个改造

如若我们想令两个 dispatch 的改造同时生效，我们就需要糅合它们。

由于 `addPromiseSupportToDispatch` 中会返回一个 `promise.then` 后的结果，它可能导致在 `addLoggingToDispatch` 读取不到 `action.type` 的情况，所以我们必须先调用 `addLoggingToDispatch`，再调用 `addPromiseSupportToDispatch`。

```javascript
const configureStore = () => {
    const store = createStore(App);

    if (process.env.NODE_ENV !== "production") {
        store.dispatch = addLoggingToDispatch(store);
    }

    store.dispatch = addPromiseSupportToDispatch(store);

    return store;
}
```

在这段代码中，在执行 `addPromiseSupportToDispatch` 之前，如果是在开发环境下，`store` 已经是一个被包装过的对象，并不是默认的 `store` 对象了。因此，在之前的 `addPromiseSupportToDispatch`、`addLoggingToDispatch` 中，部分命名显得不是十分合适。我们可以使用 `next` 这个名称来代替，来代表下一个封装过的 store 对象：

```javascript
const addLoggingToDispatch = store => {
    const next = store.dispatch;

    return action => {
        // ...
        const returnValue = next(action);
        // ...
        return returnValue;
    }
}

const addPromiseSupportToDispatch = store => {
    const next = store.dispatch;
    return action => {
        if (isPromise(action)) {
            return action.then(next);
        }
        return next(action);
    }
}
```

redux 中有"**中间件**"的概念，它解决了采用上述方法零散的修改 API 接口的问题，它采用一个中间件数组，来统一管理 store 的封装。

> 什么是中间件？
>
> 中间件是 `dispatch` 的改造增强函数，上文中的 `addPromiseSupportToDispatch` 和 `addLoggingToDispatch` 都是中间件。

Redux 的核心思想就是将 dispatch 增强改造的函数（中间件）先存起来，然后提供给Redux，Redux 负责依次执行。这样每一个中间件都对 dispatch 依次进行改造，并将改造后的 dispatch（即 next）向下传递，即将控制权转移给下一个中间件，完成进一步的增强。

因此 configureStore 的代码可以改写为：

```javascript
const configureStore = () => {
    const store = createStore(App);
    const middlewares = [];
    if (process.env.NODE_ENV !== 'production') {
        middlewares.push(addLoggingToDispatch);
    }
    middlewares.push(addPromiseSupportToDispatch);
    // add
    wrapDispatchWithMiddlewares(store, middlewares);
    return store ; 
}
```

可以发现替换方法变成了推入数组之外，增加了一个 `wrapDispatchWithMiddlewares` 方法，从命名上不难看出这是为了封装中间件。

下面就来实现这个方法：

```javascript
const wrapDispatchWithMiddlewares = (store, middlewares) => {
    middlewares.forEach(middleware => {
        store.dispatch = middleware(store)(store.dispatch);
    });
}
```

可以发现这里我们传入了`store.dispatch`， 这表示每个中间件都不需要自己去 store 中读取 dispatch，因此需要再次改造中间件：

```javascript
const promiise = store => next => action => {
    if (isPromise(action)) {
        return action.then(next);
    }
    return next(action);
}

const logger = store => next => action => {
    // ...
    returnValue = next(action);
    // ...
    return returnValue;
}
```

## 中间件

redux 本身暴露出一个 `applyMiddleware(...middlewares)` 方法（你可以点击[这里](https://www.redux.org.cn/docs/api/applyMiddleware.html)了解更多）。

对于上面三个章节的内容，在实际调用中间件时我们可以如下使用：

```javascript
import { applyMiddleware } from "redux";
import promise from "redux-promise";
import createLogger from "redux-logger";

const configureStore = () => {
    const middlewares = [];

    if (process.env.NODE_ENV !== "production") {
        middlewares.push(createLogger());
    }
    middlewares.push(promise);

    return createStore(
        reducer,
        applyMiddleware(...middlewares)
    )
}
```

经由 `applyMiddleware` 方法返回的内容，称为 `enhancer`。

> enhancer (Function): createStore 的最后一个参数，Store enhancer 是一个组合 store creator 的高阶函数，返回一个新的强化过的 store creator。这与 middleware 相似，它也允许你通过复合函数改变 store 接口。

我们来查看一下 `createStore` 中关于 `enhancer` 的源码部分：

```javascript
export default function createStore(reducer, preloadedState, enhancer) {
    // ...
    if (typeof enhancer !== "undefined") {
        if (typeof enhancer !== "function") {
            throw new Error("...");
        }

        return enhancer(createStore)(reducer, preloadedState);
    }
    // ...
}
```

我们再来查看一下 `applyMiddleware` 的源码部分：

```javascript
export default function applyMiddleware(...middlewares) {
    return (createStore) => (reducer, preloadedState) => {
        const store = createStore(reducer, preloadedState);
        let dispatch = store.dispatch;
        let chain = [];

        const middlewareAPI = {
            getState: store.getState,
            dispatch: (action) => dispatch(action)
        };

        chain = middlewares.map(middleware => middleware(middlewareAPI));
        dispatch = compose(...chain)(store.dispatch);

        return {
            ...store,
            dispatch
        }
    }
}
```

这几行中代码中，应用了大量的函数式编程思想，如 高阶函数、函数组合、柯里化等。

```
export default function applyMiddleware(...middlewares)
```

这里使用了扩展运算符，使得 applyMiddleware 可以接收任意个数的中间件。接下来，它会返回一个函数：

```
return (createStore) => (reducer, preloadedState) => {...}
```

对应于 createStore.js 里的代码，它作为一个三级柯里化的函数，相当于：

```
applyMiddleware(...middlewares)(createStore)(reducer, initialState)
```

这里借用了原始的 createStore 方法，创建了一个新的增强版 store。

```
const store = createStore(reducer, preloadedState)
let dispatch = store.dispatch
let chain = []
```

这里记录了原始的 store 和 dispatch 方法，并准备了一个 chain 数组。

```
const middlewareAPI = {
    getState: store.getState,
    dispatch: (action) => dispatch(action)
}
chain = middlewares.map(middleware => middleware(middlewareAPI))
```

middlewareAPI 是提供给第三方中间件它们需要使用的参数，其中包括了原始的 store.getState 和 dispatch 方法，至于用不用是看它们自己的需求。

```
dispatch = compose(...chain)(store.dispatch)
```

上述代码最终通过 `compose` 函数进行实现：

```
export default function compose(...funcs) {
    if (funcs.length === 0) {
        return arg => arg;
    }

    if (funcs.length === 1) {
        return funcs[0];
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
```

实际上，compose 方法只是将中间件串联起来：

```
middlewareA(middlewareB(middlewareC(store.dispatch)));
```

#### 中间件的实现模板

```javascript
const middlewareName = store => next => action => {
    // do something...
    
    // 需要return dispatch 方法
    return next(action);
}
```

## react-redux

react-redux 通过 Provider 组件和 Connect 组件使得 React 和 Redux 互相联立。

#### Provider

Provider 的构造，使得获取 store 信息的组件成为了 Provider 组件的子组件，父子组件的通信，一般可以使用 props 和 props 的回调来实现。

React 的 context 特性，提供了一个无需为每层组件手动添加 props，就能在组件树间进行数据传递的方法。这个特性十分适合 Provider 组件进行 store 信息的传递。

> [React 高级特性——Context](https://react.docschina.org/docs/context.html)

下面贴出一些重要代码：

```javascript
const ReactReduxContext = React.createContext(null);

export default class Provider extends React.Component {
    constructor(props, context) {
        super(props, context)
        const { store } = props
    }

    render() {
        const Context = this.props.context || ReactReduxContext

        return (
            <Context.Provider value={this.state}>
                {this.props.children}
            </Context.Provider>
        )
    }
}
```

#### connect

Provider 组件提供了直接访问 store 的基础，而 connect 方法则是真正连接了 Redux store 和 React 组件的工具。

connect 方法通过传入的 mapStateToProps、mapDispatchToProps、mergeProps、options 参数，计算出应该传递给 React 组件哪些属性和信息。

你可以直接阅读下面简单抽离的有关发布-订阅的源码，也可以阅读[完整源码](https://github.com/reduxjs/react-redux/blob/4.x/src/components/connect.js)

```javascript
export default function connect(
    mapStateToProps, 
    mapDispatchToProps, 
    mergeProps, 
    options = {}
) {
    // ...
    return function wrapWithConnect(WrappedComponent) {
        class Connect extends Component {
            constructor(props, context) {
                super(props, context)
                this.version = version
                this.store = props.store || context.store
                const storeState = this.store.getState()
                this.state = { storeState }
            }

            render() {
                this.renderedElement = createElement(WrappedComponent,
                    this.mergedProps
                )
                return this.renderedElement;
            }

            trySubscribe() {
                if (shouldSubscribe && !this.unsubscribe) {
                    this.unsubscribe = this.store.subscribe(this.handleChange.bind(this))
                    this.handleChange()
                }
            }

            tryUnsubscribe() {
                if (this.unsubscribe) {
                    this.unsubscribe()
                    this.unsubscribe = null
                }
            }

            handleChange() {
                const storeState = this.store.getState()
                this.setState({ storeState })
            }

            componentDidMount() {
                this.trySubscribe()
            }
        }

        return hoistStatics(Connect, WrappedComponent)
    }
}
```

总结： 

+ 通过 context 获取 Provider 的 store ，因此它具有了访问 store.state 的能力。

```javascript
this.store = props.store || context.store
const storeState = this.store.getState()
this.state = { storeState }
```

+ connect 方法返回一个函数，该函数接收外部传入的业务组件`return function wrapWithConnect(WrappedComponent)`，并且返回一个注入了 store 相关信息的 React 组件 `return hoistStatics(Connect, WrappedComponent)`

+ 这个返回的 React 组件重新渲染外部传入的原业务组件，并把 connect 中传入的 mapStateToProps、mapDispatchToProps 等与组件中原有的 props 合井(`hoistStatics(Connect, WrappedComponent)`)

> hoist-non-react-statics
>
> Copies non-react specific statics from a child component to a parent component. Similar to Object.assign, but with React static keywords blacklisted from being overridden.
>
> 该方法会将资源组件中的非 react 方法绑定到目标组件上
> 你可以在该依赖的 github 仓库获取更多信息：点击[这里](https://github.com/mridgway/hoist-non-react-statics)

## 参考资料

+ 《React状态管理与同构实战》
+ [Redux 简单实现（四）：react-redux——毛球的博客](https://maoqxxmm.github.io/blog/2019/03/30/Notes/Redux%20%E7%AE%80%E5%8D%95%E5%AE%9E%E7%8E%B0%EF%BC%88%E5%9B%9B%EF%BC%89%EF%BC%9Areact-redux/)