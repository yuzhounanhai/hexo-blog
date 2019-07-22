---
title: 两数相加
categories:
- 算法
tags:
- LeetCode解题
---

<br/>

> 给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那 两个 整数，并返回他们的数组下标。
>
> 你可以假设每种输入只会对应一个答案。但是，你不能重复利用这个数组中同样的元素。
>
> 示例:
>
> 给定 nums = [2, 7, 11, 15], target = 9
>
> 因为 nums[0] + nums[1] = 2 + 7 = 9
> 所以返回 [0, 1]
>
> 来源：力扣（LeetCode）
> 链接：https://leetcode-cn.com/problems/two-sum
> 著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。

标签：`哈希表`

<!-- more -->

```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // 定义一个哈希表
    var map = {};
    for(var i = 0; i < nums.length; i++) {
        // 从哈希表中取 target - nums[i] 的数组下标索引
        var j = map[target - nums[i]];
        // 如果取到了内容 并且哈希表中记录的数组下标索引和当前不一致（排除重复数据干扰）
        if (typeof j === 'number' && i !== j) {
            return [j, i];
        }
        // 否则将当前的 值-下标 记录到哈希表中
        map[nums[i]] = i;
    }
};
```

测试用例：

+ nums = [2, 7, 11, 15], target = 9 期望输出[0, 1]
+ nums = [2, 5, 11, 5], target = 10 期望输出[1, 4]