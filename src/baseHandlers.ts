import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false): (target: ProxyHandler<object>, key: string) => any {
  return function get(target: ProxyHandler<object>, key: string) {

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    // 依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return Reflect.get(target, key);
  };
}

function createSetter() {
  return function set(
    target: ProxyHandler<object>,
    key: string,
    value: string
  ) {
    let res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: object, key: string, value: string) {
    console.warn(`key:${key} 是 readonly, 不允许修改`);
    return true;
  },
};