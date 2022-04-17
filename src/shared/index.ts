export const extend = Object.assign;

export function isObject(value: any) {
  return value !== null && typeof value === "object";
}

export function isString(value: any) {
  return value !== null && typeof value === "string";
}

export function isFunction(value: any) {
  return value !== null && typeof value === "function";
}

export function hasChanged(value: any, oldValye: any) {
  return !Object.is(value, oldValye);
}

export const hasOwn = (val: any, key: string) => {
  return Object.prototype.hasOwnProperty.call(val, key);
};

export function camelize(str: string) {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
}

export function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

export function toHandlerKey(str: string) {
  return str ? "on" + capitalize(str) : "";
}
