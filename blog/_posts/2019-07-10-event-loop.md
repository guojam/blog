---
date: 2019-07-10
tags:
    - event loop, Promise
---

# Event Loop and Promise

## 浏览器的进程与线程

A process can be described as an application’s executing program. A thread is the one that lives inside of process and executes any part of its process's program.
进程可以描述为一个应用正在执行的程序。线程存在于进程内部并执行其进程程序的任何部分。

![进程与线程](https://developers.google.com/web/updates/images/inside-browser/part1/process-thread.png)

上图：进程作为边界框，线程作为抽象鱼在进程内部游动

When you start an application, a process is created. The program might create thread(s) to help it do work, but that's optional. The Operating System gives the process a "slab" of memory to work with and all application state is kept in that private memory space. When you close the application, the process also goes away and the Operating System frees up the memory.

启动应用程序时，会创建一个进程。该程序可能会创建一个或多个线程来帮助它工作，但这是可选的。操作系统为进程提供了“一块”用于工作的内存，所有的应用程序状态都保存在这个私有内存空间中。关闭应用程序时，进程也会消失，操作系统会释放内存。

![进程与内存](https://developers.google.com/web/updates/images/inside-browser/part1/memory.svg)

上图：进程使用内存空间和存储应用程序数据的示意图

A process can ask the Operating System to spin up another process to run different tasks. When this happens, different parts of the memory are allocated for the new process. If two processes need to talk, they can do so by using Inter Process Communication (IPC). Many applications are designed to work this way so that if a worker process get unresponsive, it can be restarted without stopping other processes which are running different parts of the application.

进程可以要求操作系统启动另一个进程来运行不同的任务。当这种情况发生时，将为新进程分配内存中的不同部分。如果两个进程需要通信，它们可以通过使用进程间通信(IPC)来实现。许多应用程序被设计成这样工作，这样当一个工作进程失去响应时，它可以重新启动，而不会停止运行应用程序不同部分的其他进程。

![工作进程与 IPC](https://developers.google.com/web/updates/images/inside-browser/part1/workerprocess.svg)

上图：独立进程通过 IPC 通信示意图

### 浏览器架构

如何使用进程和线程构建 Web 浏览器？ 它可以是一个具有许多不同线程的进程；也可以是多个不同的进程，这些进程带有几个通过 IPC（inter process communication） 进行通信的线程。

![浏览器架构](https://developers.google.com/web/updates/images/inside-browser/part1/browser-arch.png)

图 7：不同浏览器架构的进程/线程示意图

这些不同的体系结构是实现细节。没有关于如何构建 web 浏览器的标准规范。一种浏览器的方法可能与另一种完全不同。

### Chrome 近期架构

顶部是浏览器进程与其他处理应用程序不同部分的进程进行协调。对于渲染程序进程，将创建多个进程并分配给每个选项卡。直到最近，Chrome 还会给每个标签设置一个进程;现在，它试图为每个站点提供自己的进程，包括 iframes(参见站点隔离)。

![浏览器架构](https://developers.google.com/web/updates/images/inside-browser/part1/browser-arch2.png)

上图：Chrome 的多进程架构示意图。渲染进程下显示了多个层，表明 Chrome 为每个标签页运行多个渲染进程。

### 进程各自控制什么

下表描述了每个 Chrome 进程及其控制的内容

| 进程     | 它所控制的                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Browser  | 控制应用程序的“ chrome”部分，包括地址栏，书签，后退和前进按钮。还处理 Web 浏览器的隐形，特权部分，例如网络请求和文件访问。 |
| Renderer | 控制选项卡内显示网站的任何内容。                                                                                           |
| Plugin   | 控制网站使用的任何插件，例如 flash。                                                                                       |
| GPU      | 独立于其他进程处理 GPU 任务。它被分离到不同的进程中，因为 gpu 处理来自多个应用程序的请求，并在同一个表面上绘制它们。       |

![Chrome 进程](https://developers.google.com/web/updates/images/inside-browser/part1/browserui.png)

图 9：不同进程指向浏览器 UI 的不同部分

## Event Loop

### 渲染进程

浏览器渲染进程的主要常驻线程：

-   GUI 渲染线程
-   JS 引擎线程
-   事件触发线程
-   定时触发器线程
-   异步 http 请求线程

### JavaScript 是单线程

-   Web Worker 线程也是独立于主线程的。worker 将运行在与当前 window 不同的另一个全局上下文中。在 worker 线程中不能直接中操纵 DOM 元素，不能使用 window 对象中的某些方法和属性。
-   主线程和 worker 线程相互之间使用 postMessage() 方法来发送信息, 并且通过 onmessage 这个 event handler 来接收信息（传递的信息包含在 Message 这个事件的 data 属性内) 。数据的交互方式为传递副本，而不是直接共享数据。

### whatwg 规范和 ECMA 规范

[whatwg](https://html.spec.whatwg.org/multipage/webappapis.html)

[ECMA262](https://tc39.es/ecma262/#sec-hostenqueuepromisejob)

JavaScript 引擎(如 V8) 负责实现 ECMAScript 标准。
Job Queue 是 Javascript 引擎管理 job，jobQueue 的模型

JavaScript Runtime (managed runtime environment for JavaScript，JavaScript 托管运行时环境。如浏览器、nodejs) 负责实现 event loop。
event loop 是 JavaScript Runtime 管理 task，taskQueue 的模型。

JavaScript Runtime 将 Job Queue 实现为 Event loop 中的 microtask queue （Chromium 中是通过直接使用 V8 提供的 microtask queue 的接口实现）

### Event Loop 规范

An event loop has one or more task queues. A task queue is a set of tasks.
一个事件循环有一个或多个任务队列。 一个任务队列是一个任务的集合。

注意：
Task queues are sets, not queues, because step one of the event loop processing model grabs the first runnable task from the chosen queue, instead of dequeuing the first task.
任务队列 是 集合 而非 队列， 因为 [事件循环处理模型](#事件循环处理模型)的第一步 会从选中的队列中取第一个 可运行 任务，而不是 出列 第一个任务。

Tasks encapsulate algorithms that are responsible for such work as:
任务封装了负责以下工作的算法：

-   Events 浏览器事件
    在特定的 EventTarget 对象上分派 Event 对象通常是由专门的任务完成的。
-   Parsing HTML 解析器的解析
    HTML 解析器标记一个或多个字节，然后处理所有结果标记，通常是一项任务。
-   Callbacks 回调
    调用回调通常是由专门的任务完成的。
-   Using a resource 使用资源
    当算法获取资源时，如果获取以非阻塞方式发生，则一旦部分或全部资源可用，则由任务执行对资源的处理。
-   Reacting to DOM manipulation 响应 dom 操作
    某些元素的任务会响应 DOM 操作而触发，例如 当该元素插入文档中时。

event loop 由哪些部分组成：

-   Each event loop has a currently running task, which is either a task or null. Initially, this is null. It is used to handle reentrancy.
    每个事件循环都有一个当前正在运行的任务，该任务要么是一个任务，要么为空。最初，它为空。它用于处理可重入性。

-   Each event loop has a microtask queue, which is a queue of microtasks, initially empty. A microtask is a colloquial way of referring to a task that was created via the queue a microtask algorithm.
    每个事件循环都有一个微任务队列，这个队列最初为空。微任务是指通过 `微任务排队` 算法创建的任务。

-   Each event loop has a performing a microtask checkpoint boolean, which is initially false. It is used to prevent reentrant invocation of the perform a microtask checkpoint algorithm.
    每个事件循环都有一个执行微任务检查点的布尔值，该布尔值最初为 false。 它用于防止执行微任务检查点算法的可重入调用。

### 事件循环处理模型

事件循环只要存在，就会不断执行以下步骤：

1. Let taskQueue be one of the event loop's task queues, chosen in an implementation-defined manner, with the constraint that the chosen task queue must contain at least one runnable task. If there is no such task queue, then jump to the microtasks step below.

    定义 taskQueue 是事件循环的任务队列之一，以实现定义的方式进行选择，并具有约束条件，即所选任务队列必须包含至少一个可运行任务。如果没有此类任务队列，请跳至下面的微任务步骤

    Note: Remember that the microtask queue is not a task queue, so it will not be chosen in this step. However, a task queue to which the microtask task source is associated might be chosen in this step. In that case, the task chosen in the next step was originally a microtask, but it got moved as part of spinning the event loop.

    请记住，微任务队列不是任务队列，因此在此步骤中不会选择它。但是，在这个步骤中可以选择与微任务任务源相关联的任务队列。在这种情况下，下一步中选择的任务最初是一个微任务，但它作为`spinning the event loop` 的一部分被移动了。

2. Let oldestTask be the first runnable task in taskQueue, and remove it from taskQueue

    定义 oldestTask 为 taskQueue 中的第一个可运行任务，将其从 taskQueue 中删除

3. Set the event loop's currently running task to oldestTask.
   将事件循环的当前正在运行的任务设置为 oldestTask。

4. Let taskStartTime be the current high resolution time.
   定义 taskStartTime 为当前的高精度时间。

5. Perform oldestTask's steps.
   执行 oldestTask 的 步骤。

6. Set the event loop's currently running task back to null.
   将事件循环当前运行的任务设置为 null

7. Microtasks: Perform a microtask checkpoint.
   微任务：执行微任务检查点。

8. Let hasARenderingOpportunity be false.
   设置 hasARenderingOpportunity 为 false

9. Let now be the current high resolution time.
   设置 now 为当前的高精度时间。

10. Report the task's duration by performing the following steps:
    通过执行以下步骤报告 任务 的持续时间

    1. Let top-level browsing contexts be an empty set.

    让顶级浏览上下文为空集。

    2. For each environment settings object settings of oldestTask's script evaluation environment settings object set, append setting's top-level browsing context to top-level browsing contexts.

    对 oldestTask 的 脚本执行环境设置对象集合 的每个 环境设置对象 的设置(settings)， 追加 setting 的 顶级浏览上下文 到 top-level browsing contexts。

    3. Report long tasks, passing in taskStartTime, now (the end time of the task), top-level browsing contexts, and oldestTask.
       报告长任务，传入 taskStartTime，now（任务的结束时间），顶级浏览上下文和 oldestTask。

11. Update the rendering: if this is a window event loop, then:
    更新渲染: ...

12. all of the following are true

13. If this is a worker event loop, then:

### 微任务：执行微任务检查点

When a user agent is to perform a microtask checkpoint:

1.  If the event loop's performing a microtask checkpoint is true, then return.

    如果事件循环的完成微任务检查点为 true，则返回。

2.  Set the event loop's performing a microtask checkpoint to true.

    将事件循环的完成微任务检查点设置为 true。

3)  While the event loop's microtask queue is not empty:
    当事件循环的微任务队列不为空时

        1. Let oldestMicrotask be the result of dequeuing from the event loop's microtask queue.
        设置oldestMicrotask为从事件循环的微任务队列中出队的结果

        2. Set the event loop's currently running task to oldestMicrotask.
        将事件循环的当前正在运行的任务设置为oldestMicrotask。

        3. Run oldestMicrotask.
        运行oldestMicrotask

        Note: This might involve invoking scripted callbacks, which eventually calls the clean up after running script steps, which call this perform a microtask checkpoint algorithm again, which is why we use the performing a microtask checkpoint flag to avoid reentrancy.
        注意： 这可能涉及调用脚本回调，该回调最终在运行脚本步骤后调用清理，调用该脚本步骤再次执行微任务检查点算法，这就是为什么我们使用执行微任务检查点标志来避免重入。

        4. Set the event loop's currently running task back to null.
        将事件循环的当前正在运行的任务设置回null。

4.  For each environment settings object whose responsible event loop is this event loop, notify about rejected promises on that environment settings object.

    对于其负责的事件循环是此事件循环的每个环境设置对象，通知该环境设置对象上被 reject 的 promises。

5.  Cleanup Indexed Database transactions.
    清理 Indexed Database 事务

6.  Perform ClearKeptObjects().
    执行 ClearKeptObjects()

    Note: When WeakRef.prototype.deref() returns an object, that object is kept alive until the next invocation of ClearKeptObjects(), after which it is again subject to garbage collection.

7.  Set the event loop's performing a microtask checkpoint to false.

    将事件循环的完成微任务检查点设置为 false

补充说明:

-   执行微任务队列时，microtask queue 中所有的任务都会被依次取出来执行，直到 microtask queue 为空；
-   在这个过程中新添加进来的 microtask 会被添加到 microtask queue 尾部，在本次处理流程中被处理；
-   微任务之间没有 UI 或网络事件处理：它们立即一个接一个地运行。

12. UI rendering
    执行完所有的 microtask 之后， 进入浏览器是否需要 render 的判断。如果有，开始执行 UI render。UI render 完毕之后接着下一轮 Event Loop

13. 如果宏任务队列为空，等待直到出现宏任务。
14. 转到步骤 1。

### 任务说明

macroTask(tasks)： script, setTimeout, setInterval, setImmediate(Node), requestAnimation(浏览器), IO, UI rendering
microtask(jobs)：process.nextTick(Node), Promise, Object.observe, MutationObserver(浏览器)

-   queue 可以看做一种数据结构，用以存储需要执行的函数
-   timer 类型的 API（setTimeout/setInterval）注册的函数，等**_到期后_**(定时器线程计时完成)并没有被立即添加到执行栈中，而是进入 task 队列，等待主线程执行
-   其余 API 注册函数直接进入自身对应的 task/microtask 队列
-   Event Loop 执行一次，从 task 队列中拉出一个 task 执行
-   Event Loop 继续检查 microtask 队列是否为空，依次执行直至清空队列

### setInterval

在执行 macrotask queue 时，执行 setInterval，之后再次将 setInterval 加入下一个 macrotask

## Promise

### 执行 Promise then

根据：[PerformPromiseThen 2022 规范](https://tc39.es/ecma262/#sec-performpromisethen)

-   If promise.[[PromiseState]] is pending, then

    a. Append fulfillReaction as the last element of the List that is promise.[[PromiseFulfillReactions]].
    b. Append rejectReaction as the last element of the List that is promise.[[PromiseRejectReactions]].

-   Else if promise.[[PromiseState]] is fulfilled, then

    a. Let value be promise.[[PromiseResult]].
    b. Let fulfillJob be NewPromiseReactionJob(fulfillReaction, value).
    c. Perform HostEnqueuePromiseJob(fulfillJob.[[Job]], fulfillJob.[[Realm]]).

调用 then 时，如果 promise 是 pending 状态, fulfillReaction/rejectReaction 回调会加到 promise 的 [[PromiseFulfillReactions]]/[[PromiseRejectReactions]] 列表里成为最后一项。 (待 Promise 状态变为 fulfilled 后，将该列表中的每一项加入 microtask 队列。)

如果 promise 是 fulfilled 状态, fulfillReaction 会进入 PromiseJobs（microtask queue）。

在 promise then 内部返回一个 thenable 对象会发生什么？
promise p return 一个 promise p2 的时候，其实是将这个 p2 的 then 加入到了微任务队列中，同时将 p 的 resolve 和 reject 传给 p2.
p2 中的 then 全部调用完成之后，会将 p 的 resolve 放入微任务队列，resolve 完成之后，这个时候 p 的状态才会变化，继续执行 p 的 then

## 参考

[Inside look at modern web browser](https://developers.google.com/web/updates/2018/09/inside-browser-part1)，[中文版](https://github.com/xitu/gold-miner/blob/master/TODO1/inside-look-at-modern-web-browser-part1.md)

[并发模型与事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop)

[从浏览器多进程到 JS 单线程，JS 运行机制最全面的一次梳理 ](http://www.dailichun.com/2018/01/21/js_singlethread_eventloop.html)

[ECMAScript 的 Job Queues 和 Event loop 有什么关系？](https://www.zhihu.com/question/40063533/answer/271176956)

[JavaScript Visualized Series' Articles(https://dev.to/lydiahallie/series/3341)

[异步的 Promise 的 then 方法的回调是何时被添加到 microtasks queue 中的?](https://www.zhihu.com/question/62305365)

[我以为我很懂 Promise，直到我开始实现 Promise/A+规范 | 技术点评](https://juejin.cn/post/6937076967283884040#heading-17)
