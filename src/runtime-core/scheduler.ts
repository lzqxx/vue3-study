const queue: any[] = [];
const p = Promise.resolve();

 // 变量控制，promise 开始执行才建新的 Promise，
//  否则 job 直接放入队列，等待 promise 执行
let isFlushPending = false;

export function nextTick(fn: any) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job: Function) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  // 变量控制，promise 开始执行才建新的 promise
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs(): any {
  isFlushPending = false;

  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
