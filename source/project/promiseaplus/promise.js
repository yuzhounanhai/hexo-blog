const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
function Promise(executor) {
    let self = this;    // 缓存当前promise实例
    self.status = PENDING;
    // 定义存放成功回调的数组
    self.onResolvedCallbacks = [];
    // 定义存放失败回调的数组
    self.onRejectedCallbacks = [];
    function resolve(value) {
        setTimeout(function() {
            if (self.status === PENDING) {
                self.status = FULFILLED;
                self.value = value;
                self.onResolvedCallbacks.forEach(cb => cb(self.value));
            }
        });
    }
    function reject(reason) {
        setTimeout(function() {
            if (self.status === PENDING) {
                self.status = REJECTED;
                self.reason = reason;
                self.onRejectedCallbacks.forEach(cb => cb(self.reason));
            }
        });
    }
    try {
        executor();
    } catch(e) {
        reject(e);
    }
}
Promise.prototype.then = function(onFulfilled, onRejected) {
    let self = this;
    onFulfilled = 
        typeof onFulfilled === 'function'
            ? onFulfilled 
            : value => value;
    onRejected = 
        typeof onRejected === 'function' 
            ? onRejected 
            : reason => { throw reason; };
    let promise2;
    if (self.status === PENDING) {
        return promise2 = new Promise(function(resolve, reject) {
            self.onResolvedCallbacks.push(function() {
                setTimeout(function() {
                    try {
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    }
                });
            });
            self.onRejectedCallbacks.push(function() {
                setTimeout(function() {
                    try {
                        let x = onRejected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    } 
                });
            });
        });
    }
    
    if (self.status === FULFILLED) {
        return promise2 = new Promise(function(resolve, reject) {
            setTimeout(function() {
                try {
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }     
            });
        });
    }
    
    if (self.status === REJECTED) {
        return  promise2 = new Promise(function(resolve, reject) {
            setTimeout(function() {
                try {
                    let x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }     
            });
        });
    }
}

function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }
    // 避免多次调用
    let isCalled = false;
    if (x instanceof Promise) {
        if (x.status === PENDING) {
            x.then(function(y) {
                // y也可能是一个promise
                resolvePromise(promise2, y, resolve, reject);
            }, reject);
        } else {
            x.then(resolve, reject);
        }
    } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        try {
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, function(y) {
                    if (isCalled) return;
                    isCalled = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, function(r) {
                    if (isCalled) return;
                    isCalled = true;
                    reject(r);
                });
            } else { // 说明是一个普通对象/函数
                resolve(x);
            }
        } catch(e) {
            if (isCalled) return;
            isCalled = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
}