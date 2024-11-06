/**
 * 实现：
 * 1、基础的三种状态切换
 * 2、异步调用回调函数
 * 3、then方法链式调用
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
      // 异步操作成功时调用，并将异步操作的结果，作为参数传递出去；
      const resolve = result => {
        this.transition(MyPromise.FULFILLED, result)
      }
      
      // reject 函数：将 Promise 对象的状态从“未完成”变为“失败”（即从 pending 变为 rejected），
      // 异步操作失败时调用，并将异步操作的错误原因，作为参数传递出去。
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

  // then 函数返回一个新的 promise 实例（或thenable对象） promise2 ，用于链式调用
  then(onFullfilled, onRejected) {
    const promise2 = new MyPromise((resolve, reject) => {
      // promise2状态何时变化，取决于当前promise1的状态
      // 1、如果promise1状态是pending，则等待promise1被resolved或rejected时执行scheduleFn()
      // 2、否则立即执行scheduleFn()。
      const scheduleFn = () => {
        // Promise/A+ 规范规定，then方法的回调函数必须异步执行，使用setTimeout()
        setTimeout(() => {
          onFullfilled = typeof onFullfilled === 'function'? onFullfilled : value => value
          onRejected = typeof onRejected === 'function'? onRejected : reason => { throw reason }
          try {
            // 将 promise1 回调函数的执行结果作为参数传递给 promise2
            if (this.promiseState === MyPromise.FULFILLED) {
              const res = onFullfilled(this.result)
              resolve(res)
            } else {
              const res = onRejected(this.result)
              reject(res)
            }
          } catch (e) {
            reject(e)
          }
        })
      }

      // 若 promise1 当前状态是 pending，将scheduleFn 方法推入待执行数组，等待 promise1 的异步任务执行完毕后， 状态转移时被执行
      if (this.promiseState === MyPromise.PENDING) {
        this.callbackFuncs.push(scheduleFn)
      } else { // 若promise1状态已改变，立即执行scheduleFn()
        scheduleFn()
      }
    })
    
    return promise2
  }
}