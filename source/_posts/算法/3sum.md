---
title: 三数相加
categories:
- 算法
tags:
- LeetCode解题
---

<br/>

> 给定一个包含 n 个整数的数组 nums，判断 nums 中是否存在三个元素 a，b，c ，使得 a + b + c = 0 ？找出所有满足条件且不重复的三元组。
>
> 注意：答案中不可以包含重复的三元组。
>
> 例如, 给定数组 nums = [-1, 0, 1, 2, -1, -4]，
>
> 满足要求的三元组集合为：
> [
>   [-1, 0, 1],
>   [-1, -1, 2]
> ]
>
> 来源：力扣（LeetCode）
> 链接：https://leetcode-cn.com/problems/3sum
> 著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。

标签：`双指针`

<!-- more -->

#### 思路

要令 a + b + c = 0，那么 a b c 必然是正负数的组合或者全为0。

既然是正负数的组合，那么对一个已经排序过的数组进行操作会更加容易。

```javascript
nums.sort((a, b) => a - b);
```

对于一个已经排好序的数组：[-4, -1, -1, 0, 1, 2]，使用双指针(当前，首指针、尾指针)，如果cur+首+尾>0，说明尾指针指向的数据过大，所以要降低尾指针，反之，要增大首指针。

```
-4  -1  -1  0   1   2
cur  ↑              ↑

-4  -1  -1  0   1   2
        cur ↑       ↑
```

```javascript
// cur 首指针（初始值为cur + 1） 尾指针（初始值在末尾），因为必定会有三个，所有cur的循环应该是nums.length - 2
for(let i = 0; i < nums.length - 2; i++) {
    for(let j = i + 1, k = nums.length - 1; j < k;) {
        let sum = nums[i] + nums[j] + nums[k];
        if (sum > 0) {
            k--;
        } else if (sum < 0) {
            j++;
        } else {
            // push
            j++;
        }
    }
}
```

#### 优化

+ 对于一个纯正数或者纯负数的数组，对于三数相加=0是无解的。
+ 如若cur已经是一个正数（代表首尾指针也都为正数），此时可以停止循环。


#### 去重

> 注意：答案中不可以包含重复的三元组。

对于[0, 0, 0, 0]这种数据，按照我们的程序将会出现以下答案
[
    [0,0,0],
    [0,0,0],
    [0,0,0]
]

也就是说我们cur 首 尾指针在遇到相同值时要跳过
```
if (nums[i] === nums[i - 1]) {
    // 跳过当前i    
}

if (i + 1 !== j && nums[j] === nums[j - 1]) {
    // 跳过当前j
}

if (k !== len - 1 && nums[k] === nums[k + 1]) {
    // 跳过当前k
}
```

#### 完整代码
```javascript
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    let len = nums.length;
    let result = [];
    if (len < 3) return result;
    
    nums.sort((a, b) => a - b);
    
    // 全是正数 || 全是负数
    if (nums[0] <= 0 && nums[len - 1] >= 0) {
        for(let i = 0; i < len - 2; i++) {
            // 如果current已经是一个大于0的数了就停止循环
            if (nums[i] > 0) {
                break;
            }
            // 如果当前i和前面的一样，跳过当前i，防止重复三元组
            if (nums[i] === nums[i - 1]) {
                continue;
            }
            for(let j = i + 1, k = len - 1; j < k;) {
                // 如果j不是初始值，且当前j和前一个j所指向的值相同，跳过当前j
                if (i + 1 !== j && nums[j] === nums[j - 1]) {
                    j++;
                    continue;
                }
                // 如果k不是初始值，且当前k和前一个k所指向的值相同，跳过当前k
                if (k !== len - 1 && nums[k] === nums[k + 1]) {
                    k--;
                    continue;
                }
                // 三值相加判定
                let sum = nums[i] + nums[j] + nums[k];
                if (sum > 0) {
                    k--;
                } else if (sum < 0) {
                    j++;
                } else {
                    result.push([nums[i], nums[j], nums[k]]);
                    j++;
                    k--;
                }
            }
        }
    }
    
    return result;
};
```