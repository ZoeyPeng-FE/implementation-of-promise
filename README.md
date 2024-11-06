# a promise implementation with the Promises/A+ specification

实现一个符合 Promise/A+ 标准的 Promise 类，帮助自己更好地理解 Promise 的工作原理。

# files
- /myPromiseV1.js 实现了 Promise/A+ 规范的 2.1 至 2.2 部分。
- /myPromiseA+.js 实现了 Promise/A+ 所有规范。

使用工具测试 MyPromise 的完整性：[promises-aplus-tests](https://github.com/promises-aplus/promises-tests)，目前的实现通过全部 872 个实例。
  
```
npm install 
npm run test
```