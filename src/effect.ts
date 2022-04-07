const targetMap = new Map();
let activeEffect: any;

export type EffectScheduler = (...args: any[]) => any;

class ReactiveEffect {
  constructor(public fn: Function, public scheduler?: Function | null) {
    console.log("创建 ReactiveEffect 对象");
  }

  run() {
    activeEffect = this;
    return this.fn();
  }
}

interface reactiveEffectOption {
  scheduler?: EffectScheduler;
}

export function effect(fn: Function, options?: reactiveEffectOption | null) {
  const _effect = new ReactiveEffect(fn);
  _effect.scheduler = options?.scheduler;
  _effect.run();

  // _effect.run.bind(_effect);
  return _effect.run.bind(_effect);
}

export function track(target: object, key: any) {
  if (!activeEffect) return;

  let targetDeps = targetMap.get(target);
  if (!targetDeps) {
    targetDeps = new Map();
    targetMap.set(target, targetDeps);
  }

  let deps = targetDeps.get(key);
  if (!deps) {
    deps = new Set();
    targetDeps.set(key, deps);
  }
  deps.add(activeEffect);
}

export function trigger(target: any, key: any) {
  const targetDeps = targetMap.get(target);
  if (!targetDeps) return;

  const deps = targetDeps.get(key);
  if (!deps || deps.length === 0) return;

  deps.forEach((dep: any) => {
    if (dep.scheduler) {
      dep.scheduler();
    } else {
      dep.run();
    }
  });
}
