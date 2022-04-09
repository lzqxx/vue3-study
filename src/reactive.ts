import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<object>
) {
  return new Proxy(target, baseHandlers);
}

export function reactive(target: object): any {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target: object): any {
  return createReactiveObject(target, readonlyHandlers);
}
