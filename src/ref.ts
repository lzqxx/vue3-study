import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class refImpt {
  private _value: any;
  public dep: Set<unknown>;
  private _rawValue: any;
  public __v_isRef = true;

  constructor(value: any) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    // 收集依赖
    if (isTracking()) {
      trackRefValue(this);
    }
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerRefValue(this);
    }
  }
}

function convert(value: any) {
  return isObject(value) ? reactive(value) : value;
}

export function triggerRefValue(ref: any) {
  triggerEffects(ref.dep);
}


export function trackRefValue(ref: any) {
  if (isTracking()) {
    // effect执行时 activeEffect 会赋值，然后收集依赖
    trackEffects(ref.dep);
  }
}

export function ref(value: any) {
  return new refImpt(value);
}

export function isRef(ref: any) {
  return !!ref.__v_isRef;
}

// 为了调用时省略.value，template时有用到
export function unRef(ref: any) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs: any) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(target[key]);
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      }

      return Reflect.set(target, key, value);
    },
  });
}
