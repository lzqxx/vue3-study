import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
import { isObject } from "./shared";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createReadonlySetter();
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(
  isReadonly = false,
  shallow = false
): (target: any, key: string) => any {
  return function get(target: any, key: string) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    // 依赖收集
    if (!isReadonly) {
      track(target, key);
    }

    // 不嵌套
    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      // 嵌套
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
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

function createReadonlySetter() {
  return function set(target: object, key: string, value: string) {
    console.warn(`key:${key} 是 readonly, 不允许修改`);
    return true;
  }
}

export const mutableHandlers = {
  get,
  set,
};

export const shallowReactiveHandlers = {
  get: shallowReactiveGet,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
};

export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set: readonlySet,
};

