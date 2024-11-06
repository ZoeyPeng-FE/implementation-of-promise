/**
 * 几个实现要点：
 * 1、基础的三种状态的切换
 * 2、异步调用回调函数（若 then 调用时，promise 内部还处于 pending 状态，就将回调函数推入数组存放，待异步代码执行完后，执行 resolve 或 reject 改变状态后，再执行数组中的函数）
 * 3、then 方法链式调用（then 方法也返回一个 promise 对象，准确说是 thenable 对象，即包含 then 方法的对象）
 * 4、处理 promise 回调函数返回的结果是一个 promise 对象的情况
*/
class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  constructor(executor) {
    this.promiseState = MyPromise.PENDING // 异步状态：pending/fulfilled/rejected
    this.result = null // 异步结果
    this.callbackFuncs = [] // 存放异步后需要调用的回调函数

    if(typeof executor === 'function') {
      // 用箭头函数调用状态转移函数，保证this指向正确

      // resolve 函数：将 Promise 对象的状态从“未完成”变为“成功”（即从 pending 变为 resolved），
      // 【在异步操作成功时调用】，并将异步操作的结果，作为参数传递出去；
      const resolve = result => {
        this.transition(MyPromise.FULFILLED, result)
      }
      // reject 函数：将 Promise 对象的状态从“未完成”变为“失败”（即从 pending 变为 rejected），
      // 【在异步操作失败时调用】，并将异步操作报出的错误，作为参数传递出去。
      const reject = result => {
        this.transition(MyPromise.REJECTED, result)
      }
      executor(resolve, reject)
    }
  }

  // 状态转移函数
  transition(state, result) {
    // 2.1.1 & 2.1.2 & 2.1.3
    if (this.promiseState === MyPromise.PENDING) {
      this.promiseState = state // 2.1.1.1
      this.result = result // 2.1.2.2 & 2.1.3.2 

      // 状态转移时，执行回调函数
      this.callbackFuncs.forEach(callback => { // 2.2.6.1 & 2.2.6.2
        callback(this.result)
      })
    }
  }

  // then 函数为 Promise 实例添加状态改变时的回调函数，返回一个新的 promise 实例，用于链式调用，递归实现
  // 上一个 promise 的回调函数执行完后，会将返回结果链式传递
  // 上一个 promise 的回调函数内容执行完毕后，若返回的是 promise 对象（或thenable对象），那么需要等这个 promise 对象（姑且称为 resultPromise）异步操作执行完毕后将执行结果链式传递下去，再执行 promise2
  // promise1 -> then -> resultPromise -> promise2 -> newThen...
  then(onFullfilled, onRejected) {
    // 创建一个当做返回值的 promise 对象（thenable 对象），供链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      // promise2 状态何时变化，取决于当前promise1的状态
      // 1、如果 promise1 状态是 pending ，则等待 promise1 被 resolved 或 rejected 时执行 scheduleFn()
      // 2、否则立即执行 scheduleFn()。
      const scheduleFn = () => {
        // Promise/A+ 规范规定，then方法的回调函数必须异步执行，使用 setTimeout() 实现
        // 2.2.4 onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
        setTimeout(() => {
          //2.2.7.3 If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1
          onFullfilled = typeof onFullfilled === 'function'? onFullfilled : value => value
          //2.2.7.4 If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1
          onRejected = typeof onRejected === 'function'? onRejected : reason => { throw reason }
          try {
            // 将 promise1 回调函数执行后的结果传递下去
            if (this.promiseState === MyPromise.FULFILLED) {
              const x = onFullfilled(this.result)
              // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
              resolvePromise(promise2, x, resolve, reject)
            } else {
              const x = onRejected(this.result)
              // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
              resolvePromise(promise2, x, resolve, reject)
            }
          } catch (e) {
            // 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason
            reject(e)
          }
        })
      }

      // 如果 promise1 状态为 pending，则将 scheduleFn 方法推入待执行数组
      if (this.promiseState === MyPromise.PENDING) {
        this.callbackFuncs.push(scheduleFn)
      } else { // 若 promise1 状态已改变，立即执行 scheduleFn()
        scheduleFn()
      }
    })
    
    return promise2 // 2.2.7 then must return a promise. promise2 = promise1.then(onFulfilled, onRejected);
  }
}

/**
 * 为了解决 promise 回调函数返回的结果是一个 promise 对象的情况，引入一个 resolvePromise 函数
 * promise2：上一个 promise 的 then 函数返回的 promise 函数
 * x: 上一个 promise 的回调函数执行后的返回值
 * resolve：promise2的resolve
 * reject：promise2的reject
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
  if (promise2 === x) {
    reject(new TypeError('Chaining cycle'))
  }

  // 如果 x 是 promise 类型，执行 x 后调用 then 函数，并将 promise2、新的返回值 r，promise2 的 resolve、promise2 的 reject 递归传下去
  // 2.3.2 If x is a promise, adopt its state
  if (x && x instanceof MyPromise) {
    x.then(r => resolvePromise(promise2, r, resolve, reject), r => reject(r))
  } else if (x && typeof x === 'object' || typeof x === 'function') { // 2.3.3 Otherwise, if x is an object or function,
      // 2.3.3.3.3 If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
      let resolveOrRejectIsCalled = false // 用于控制 resolve / reject 只能执行其中一个
      try {
        let then = x.then // 2.3.3.1 Let then be x.then.
        // 2.3.3.3 If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise, where:
        if (typeof then === 'function') {
          // 2.3.3.3.1 If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
          then.call(x, r => {
            if (!resolveOrRejectIsCalled) {
              resolvePromise(promise2, r, resolve, reject)
              resolveOrRejectIsCalled = true
            }
          }, r => {
            // 2.3.3.3.2 If/when rejectPromise is called with a reason r, reject promise with r.
            if (!resolveOrRejectIsCalled) {
              reject(r)
              resolveOrRejectIsCalled = true
            }
          })
        } else { // 若 then 不是函数，直接执行 resolve(x)，推动 promise 状态改变
          // 2.3.3.4 If then is not a function, fulfill promise with x.
          resolve(x)
        }
      } catch (e) {
        // 2.3.3.2 If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
        // 2.3.3.3.4 If calling then throws an exception e
        // 2.3.3.3.4.1 If resolvePromise or rejectPromise have been called, ignore it.
        if (!resolveOrRejectIsCalled) {
          // 2.3.3.3.4.2 Otherwise, reject promise with e as the reason.
          reject(e)
        }
      }
    } else {
      // 2.3.4 If x is not an object or function, fulfill promise with x.
      // // 若x不是对象或函数，直接执行resolve(x)，推动promise2状态改变
      resolve(x)
    }
}

module.exports = MyPromise