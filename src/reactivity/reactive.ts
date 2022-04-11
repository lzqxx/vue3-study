import { mutableHandlers, readonlyHandlers, shallowReactiveHandlers, shallowReadonlyHandlers } from "./baseHandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

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

export function shallowReadonly(target: object): any {
  return createReactiveObject(target, shallowReadonlyHandlers);
}

export function shallowReactive(target: object): any {
  return createReactiveObject(target, shallowReactiveHandlers);
}

export function isReactive(value: any): Boolean {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: any): Boolean {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value: any): Boolean {
  return isReactive(value) || isReadonly(value);
}
