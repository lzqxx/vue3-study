import { track, trigger } from "./effect";

export function reactive(target: object): any {
  return new Proxy(target, {
    get(target, key) {
      // TODO 依赖收集
      track(target, key);
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      let res = Reflect.set(target, key, value);
      //TODO 触发依赖
      trigger(target, key);
      return res;
    },
  });
}
