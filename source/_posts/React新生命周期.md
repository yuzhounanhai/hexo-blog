---
title: React v16.3 新生命周期
categories:
- 前端
tags:
- React
---

React打算在 v17 版本推出新的 Async Rendering，提出一种可被打断的生命周期的形式，并在 v16 版本中为即将上线的这一功能做出兼容升级。（生命周期一旦被打断，下次恢复的时候又会再跑一次之前的生命周期，因此 `componentWillMount`，`componentWillReceiveProps`， `componentWillUpdate` 都不能保证只在挂载/拿到props/状态变化的时候刷新一次）

## 不安全的生命周期

随着 React 团队在 v17 版本推出的新功能上的实践，发现一些生命周期可能会带来一些危险性，这些生命周期方法经常被误解和巧妙地误用；此外，React 团队预计，对于异步渲染，它们潜在的误用可能会造成更多问题。v16.3版本发布后，官方文档中已经为这些容易出现问题的生命周期添加了 “`UNSAFE_`” 前缀。

这些生命周期是：

+ componentWillMount
+ componentWillReceiveProps
+ componentWillUpdate

<!-- more -->

> 注意：UNSAFE所代表的不安全，并不是指“安全性”，而是传达使用这些生命周期的代码在未来版本的React中更容易出现错误，特别是在启用异步渲染时。

## 版本计划
这个升级是渐进的，将会持续一整个 v16 版本。目前 React团队在这一逐步升级中做出了以下计划：

+ **16.3**：介绍别名为不安全的生命周期，`UNSAFE_componentWillMount`，`UNSAFE_componentWillReceiveProps`，和`UNSAFE_componentWillUpdate`。（旧的生命周期名称和新别名都可以在此版本中使用。）
+ **未来的16.x版本**：启用生命周期 `componentWillMount`，`componentWillReceiveProps` 和 `componentWillUpdate` 的弃用警告。（旧的生命周期名称和新别名都可以在此版本中使用，但旧名称将在开发模式中给予弃用警告。）
+ **17.0**：删除 `componentWillMount`，`componentWillReceiveProps` 和 `componentWillUpdate`。（从该版本开始，只有带“`UNSAFE_`”前缀的新别名生命周期名称可以使用。）

这意味着我们仍然可以使用修改了别名后的生命周期。

## 新的生命周期
为了弥补三个生命周期所带来的漏洞，React 团队将引进一批新的生命周期。

## 无法共存

> 注意：你无法将带有UNSAFE前缀的旧的生命周期与新的生命周期一起使用，一旦你混合使用了新旧生命周期后，将会报错，并告知你使用了不安全的生命周期。

## static getDerivedStateFromProps
`getDerivedStateFromProps` 是一个静态的生命周期，`getDerivedStateFromProps` 会在调用渲染方法之前调用，并且在初始挂载及后续更新时都会被调用。它应返回一个对象来更新状态，如果返回 `null` 则不更新任何内容。

此方法无权访问组件实例。如果需要，可以通过提取组件 `props` 的纯函数及 `class` 之外的状态，在`getDerivedStateFromProps()`和其他 `class` 方法之间重用代码。

> 注意，不管什么原因，该方法会在每次渲染前触发。这与 `UNSAFE_componentWillReceiveProps` 形成对比，后者仅在父组件重新渲染时触发，而与 `setState` 无关。

```react
class Example extends React.Component {
  static getDerivedStateFromProps(props, state) {
    // ...
  }
}
```

> 该生命周期在 v16.3 版本中存在问题，即在组件内 `State` 更新时不会触发这一生命周期，这一问题在 v16.4 得到解决，这个问题的解决意味着派生 State 更可控，同时会让滥用导致的 bug 更容易被发现。



## componentWillReceiveProps改写的替代方案
React 官网文档中推荐了以下三种替代方案：

+ 如果需要 **执行副作用**（例如，数据提取或动画）以响应 props 中的更改，可以改用为 componentDidUpdate。（P.S.统计中 echarts 绘图）

+ 如果只想在 **prop 更改时重新计算某些数据**，请使用 memoization helper 代替。（https://zh-hans.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization）

+ 如果你想在 **prop 更改时“重置”某些 state**，请考虑使组件完全受控或使用 key 使组件完全不受控 代替。


## getSnapshotBeforeUpdate
`getSnapshotBeforeUpdate()` 在最近一次渲染输出（提交到 DOM 节点）之前调用。它使得组件能在发生更改之前从 DOM 中捕获一些信息（例如，滚动位置）。此生命周期的任何返回值将作为参数传递给 `componentDidUpdate()`。

此用法并不常见，但它可能出现在 UI 处理中，如需要以特殊方式处理滚动位置的聊天线程等。

该生命周期应返回 `snapshot` 的值（或 `null`）。

例如：

```react
class ScrollingList extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 我们是否在 list 中添加新的 items ？
    // 捕获滚动​​位置以便我们稍后调整滚动位置。
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 如果我们 snapshot 有值，说明我们刚刚添加了新的 items，
    // 调整滚动位置使得这些新 items 不会将旧的 items 推出视图。
    //（这里的 snapshot 是 getSnapshotBeforeUpdate 的返回值）
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.listRef}>{/* ...contents... */}</div>
    );
  }
}
```

## 不需要使用getDerivedStateFromProps 
getDerivedStateFromProps 的存在只有一个目的：让组件在 props 变化时更新 state。

#### 反面案例

###### 反面例子1：

```react
class EmailInput extends Component {
  state = { email: this.props.email };

  render() {
    return <input onChange={this.handleChange} value={this.state.email} />;
  }

  handleChange = event => {
    this.setState({ email: event.target.value });
  };

  componentWillReceiveProps(nextProps) {
    // 这会覆盖所有组件内的 state 更新！
    // 不要这样做。
    this.setState({ email: nextProps.email });
  }
}
```

乍看之下还可以。 `state` 的初始值是 `props` 传来的，当在 `<input>` 里输入时，修改 `state`。但是如果父组件重新渲染，我们输入的所有东西都会丢失！即使在重置 `state` 前比较 `nextProps.email !== this.state.email` 仍然会导致更新。

因此直接复制 `prop` 到 `state` 是一个非常糟糕的想法。



###### 反面例子2：

继续上面的示例，我们可以只使用 props.email 来更新组件，这样能防止修改 state 导致的 bug。

```react
class EmailInput extends Component {
  state = {
    email: this.props.email
  };

  componentWillReceiveProps(nextProps) {
    // 只要 props.email 改变，就改变 state
    if (nextProps.email !== this.props.email) {
      this.setState({
        email: nextProps.email
      });
    }
  }
  
  // ...
}
```

这样的设计写法就有问题，但依然可能存在这个问题。有两个方法解决这个问题。

+ 建议使用完全受控

保证了只有一个数据源，成为了一个轻量级的函数组件。

```react
function EmailInput(props) {
  return <input onChange={props.onChange} value={props.email} />;
}
```

+ 建议使用有 key 的非可控组件

另外一个选择是让组件自己存储临时的 email state。在这种情况下，组件仍然可以从 prop 接收“初始值”，但是更改之后的值就和 prop 没关系了

```react
class EmailInput extends Component {
  state = { email: this.props.defaultEmail };

  handleChange = event => {
    this.setState({ email: event.target.value });
  };

  render() {
    return <input onChange={this.handleChange} value={this.state.email} />;
  }
}
```

为了实现值的切换，我们可以使用 `key` 这个特殊的 React 属性。

当 `key` 变化时， React 会创建一个新的而不是更新一个既有的组件。 Keys 一般用来渲染动态列表，但是这里也可以使用。


```react
<EmailInput
  defaultEmail={this.props.user.email}
  key={this.props.user.id}
/>
```

每次 ID 更改，都会重新创建 `EmailInput` ，并将其状态重置为最新的 `defaultEmail` 值。 使用此方法，不用为每次输入都添加 `key`，在整个表单上添加 `key` 更有位合理。每次 `key` 变化，表单里的所有组件都会用新的初始值重新创建。

大部分情况下，这是处理重置 `state` 的最好的办法。

## memoization

仅在输入变化时，重新计算 render 需要使用的值，这个技术叫做 memoization。

示例： 用户输入查询条件时显示匹配的项，我们可以使用派生 state 存储过滤后的列表：

```react
class Example extends Component {
  state = {
    filterText: "",
  };

  static getDerivedStateFromProps(props, state) {
    // 列表变化或者过滤文本变化时都重新过滤。
    // 注意我们要存储 prevFilterText 和 prevPropsList 来检测变化。
    if (
      props.list !== state.prevPropsList ||
      state.prevFilterText !== state.filterText
    ) {
      return {
        prevPropsList: props.list,
        prevFilterText: state.filterText,
        filteredList: props.list.filter(item => item.text.includes(state.filterText))
      };
    }
    return null;
  }

  handleChange = event => {
    this.setState({ filterText: event.target.value });
  };

  render() {
    return (
      <Fragment>
        <input onChange={this.handleChange} value={this.state.filterText} />
        <ul>{this.state.filteredList.map(item => <li key={item.id}>{item.text}</li>)}</ul>
      </Fragment>
    );
  }
}
```

这个实现避免了重复计算 `filteredList`，但是过于复杂。因为它必须单独追踪并检测 `prop` 和 `state` 的变化，在能及时的更新过滤后的 list。我们可以使用 `PureComponent`，把过滤操作放到 `render` 方法里来简化这个组件：

```react
// PureComponents 只会在 state 或者 prop 的值修改时才会再次渲染。
// 通过对 state 和 prop 的 key 做浅比较（ shallow comparison ）来确定有没有变化。
class Example extends PureComponent {
  // state 只需要保存 filter 的值：
  state = {
    filterText: ""
  };

  handleChange = event => {
    this.setState({ filterText: event.target.value });
  };

  render() {
    // PureComponent 的 render 只有
    // 在 props.list 或 state.filterText 变化时才会调用
    const filteredList = this.props.list.filter(
      item => item.text.includes(this.state.filterText)
    )

    return (
      <Fragment>
        <input onChange={this.handleChange} value={this.state.filterText} />
        <ul>{filteredList.map(item => <li key={item.id}>{item.text}</li>)}</ul>
      </Fragment>
    );
  }
}
```

上面的方法比派生 state 版本更加清晰明了。只有在过滤很大的列表时，这样做的效率不是很好。当有 `prop` 改变时 `PureComponent` 不会阻止再次渲染。为了解决这两个问题，我们可以添加 `memoization` 帮助函数来阻止非必要的过滤：


```react
import memoize from "memoize-one";

class Example extends Component {
  // state 只需要保存当前的 filter 值：
  state = { filterText: "" };

  // 在 list 或者 filter 变化时，重新运行 filter：
  filter = memoize(
    (list, filterText) => list.filter(item => item.text.includes(filterText))
  );

  handleChange = event => {
    this.setState({ filterText: event.target.value });
  };

  render() {
    // 计算最新的过滤后的 list。
    // 如果和上次 render 参数一样，`memoize-one` 会重复使用上一次的值。
    const filteredList = this.filter(this.props.list, this.state.filterText);

    return (
      <Fragment>
        <input onChange={this.handleChange} value={this.state.filterText} />
        <ul>{filteredList.map(item => <li key={item.id}>{item.text}</li>)}</ul>
      </Fragment>
    );
  }
}
```

## 改写示例

> https://zh-hans.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#examples