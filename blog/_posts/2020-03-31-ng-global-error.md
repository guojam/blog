---
date: 2020-03-31
tags:
    - Angular
    - 异常
---

# ng 全局异常处理

## 自定义异常处理器

1. 创建异常处理类并实现 [ErrorHandler](https://angular.io/api/core/ErrorHandler)
2. 配置 provider

```ts
class GlobalErrorhandler implements ErrorHandler {
    handleError(error) {
        // do something with the exception
    }
}
// root module: app.module.ts
@NgModule({
    providers: [{ provide: ErrorHandler, useClass: GlobalErrorhandler }],
})
class MyModule {}
```

当我在 handleError 方法中调用日志服务时，提示
`Uncaught Error: Provider parse errors: Cannot instantiate cyclic dependency! ApplicationRef ("[ERROR ->]"): in NgModule AppModule in ./AppModule@-1:-1`

This error can happen when the dependencies in your APP_INITIALIZER have a dependency on an Angular service, e.g. Router.

The solution is lazy injection by changing the constructor of your service to accept a Injector instead, and then resolve the value outside the constructor.

原因是在 APP_INITIALIZER 时如果需要获取 HttpClient 或是 Router 等的实例需要用 Injector 获取，不能在构造器中直接注入。
而日志服务的构造器注入了 httpClient，解决方式：构造器注入 Injector，用 get(httpClient)的方式获取 http 服务实例

## 异常数据本地化

参考
https://golb.hplar.ch/2018/10/global-errorhandler-angular.html
