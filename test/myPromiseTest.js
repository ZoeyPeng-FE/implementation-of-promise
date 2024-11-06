/*
 * @Author: pengyue
 * @Date: 2024-11-05 20:29:50
 * @LastEditors: pengyue
 * @LastEditTime: 2024-11-07 00:25:38
 * @Description: 
 */
// const promisesAplusTests = require("promises-aplus-tests");
const myPromise = require("../myPromiseA+");

// promisesAplusTests(adapter, function (err) {
//     // All done; output is in the console. Or check `err` for number of failures.
// });

module.exports = {
  deferred() {
    const result = {}
    result.promise = new myPromise((resolve, reject) => {
      result.resolve = resolve
      result.reject = reject
    })

    return result
  }
}