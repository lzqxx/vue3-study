export const extend = Object.assign;

export function isObject(value: any) {
  return value !== null && typeof value === "object";
}

export function isString(value: any) {
  return value !== null && typeof value === "string";
}

export function hasChanged(value: any, oldValye: any) {
  return !Object.is(value, oldValye);
}

export const hasOwn = (val:any, key: string) => {
  return Object.prototype.hasOwnProperty.call(val, key);
}
