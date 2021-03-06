import { extend } from "../shared";

const targetMap = new Map();
let activeEffect: any = null;
let shouldTrack = false; // 是否在收集依赖，用activeEffect可判断，但此处用此变量更有语义化

export type EffectScheduler = (...args: any[]) => any;

export class ReactiveEffect {
  deps = [];
  onStop: Function | undefined;
  active: boolean = true;
  constructor(public fn: Function, public scheduler?: Function | null) {}

  run() {
    // fix: 解决stop再runner后，无法stop的问题
    if (!this.active) {
      this.active = true;
    }

    shouldTrack = true;
    activeEffect = this;
    // 触发get事件收集依赖
    let result = this.fn();
    // 依赖收集完后清掉
    activeEffect = null;
    shouldTrack = false;
    return result;
  }

  // 实际上是清除，不是单词stop停止的含义
  stop() {
    // 优化重复调用stop的性能问题
    if (this.active) {
      clearupEffect(this);
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

function clearupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep: Set<any>) => {
    dep.delete(effect);
  });
}

interface reactiveEffectOption {
  scheduler?: EffectScheduler;
  onStop?: Function;
}

export function effect(fn: any, options?: reactiveEffectOption | null) {
  const _effect = new ReactiveEffect(fn);
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function track(target: object, key: any) {
  if (!isTracking()) return;

  // 对象依赖
  let targetDeps = targetMap.get(target);
  if (!targetDeps) {
    targetDeps = new Map();
    targetMap.set(target, targetDeps);
  }

  // 字段属性依赖
  let dep = targetDeps.get(key);
  if (!dep) {
    dep = new Set();
    targetDeps.set(key, dep);
  }
  trackEffects(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect;
}

export function trackEffects(dep: any) {
  // 属性上增加一个依赖
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    // 依赖挂上属性依赖
    activeEffect.deps.push(dep);
  }
}

export function trigger(target: any, key: any) {
  const targetDeps = targetMap.get(target);
  if (!targetDeps) return;

  const deps = targetDeps.get(key);
  if (!deps || deps.size === 0) return;

  triggerEffects(deps);
}

export function triggerEffects(dep: any) {
  dep.forEach((effect: any) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}

export function stop(runner: any) {
  runner.effect.stop();
}
