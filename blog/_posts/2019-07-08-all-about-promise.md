---
date: 2019-07-08
tags:
    - Promise
author: guojam
---

# 关于 Promise

## catch

promise
then / catch 方法 ，都返回一个新的 promise 对象
catch 为 then 的语法糖，它是 then(null, rejection)的别名。
也就是说，catch 也是 then，它用于捕获错误，它的参数也就是 then 的第二个参数。

then/catch 里的 return 值 作为之后执行的 then/catch 的参数

### catch() 与 then(null, ...) 并非完全等价

then(resolveHandler, rejectHandler) 这种形式
catch 能捕获 resolveHandler 引发的异常，而 rejectHandler 不能。

## promise 值穿透

.then 或者 .catch 的参数期望是函数，传入非函数则会发生值穿透

MDN 上关于 then 参数的说明:
如果忽略针对某个状态的回调函数参数，或者提供非函数 (nonfunction) 参数，那么 then 方法将会丢失关于该状态的回调函数信息，但是并不会产生错误。如果调用 then 的 Promise 的状态（fulfillment 或 rejection）发生改变，但是 then 中并没有关于这种状态的回调函数，那么 then 将创建一个没有经过回调函数处理的新 Promise 对象，**_这个新 Promise 只是简单地接受调用这个 then 的原 Promise 的终态作为它的终态_**。

-   onFulfilled 可选
    当 Promise 变成接受状态（fulfilled）时调用的函数。该函数有一个参数，即接受的最终结果（the fulfillment value）。如果该参数不是函数，则会在内部被替换为 (x) => x，即原样返回 promise 最终结果的函数
-   onRejected 可选
    当 Promise 变成拒绝状态（rejected）时调用的函数。该函数有一个参数，即拒绝的原因（rejection reason）。 如果该参数不是函数，则会在内部被替换为一个 "Thrower" 函数 (it throws an error it received as argument)

## Promise 哪些 API 涉及了微任务？

构造 Promise 时，exectuor 作为参数传给 Promise 的构造函数同步执行。
状态变更后被执行的回调放在微任务队列。
比如说 then、 catch 、finally。调用这些方法时，

-   如果 Promise 处于 pending 状态，这些方法的回调函数会加到 promise 的 [[PromiseFulfillReactions]]/[[PromiseRejectReactions]] 列表里成为最后一项，待 Promise 状态变为 fulfilled 后，将该列表中的每一项加入微任务队列
-   如果 Promise 处于 fulfilled 状态， 回调会直接放入微任务队列

## promise 与 observable 区别

[不要把 Rx 用成 Promise](https://zhuanlan.zhihu.com/p/20531896)

1. observables 是 lazy evaluation
   无论是否调用 then，promise 都会被立即执行；而 observables 却只是被创建，并不会执行，只有在真正需要结果的时候才会被执行
2. observable 能够在执行前或者执行过程中被 cancel，或者叫做 dispose。
3. 对于 promise，不论怎么调用 then，实际上的异步操作只会被执行一次，多次调用没有效果；但是对于 observable，多次调用 forEach 或者使用 retry 方法，能够触发多次异步操作。
4. observable 可以进行组合变换。observable 可以看做列表，可以进行各种组合变换，即 LINQ 操作，比如 merge，zip，map，sum 等等。这是 observable 相对于 promise 的一大优势。
