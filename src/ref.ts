import { isTracking, trackRefValue, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";

class refImpt {
  private _value: any;
  public dep: Set<unknown>;
  private _rawValue: any;

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

function triggerRefValue(ref: any) {
  triggerEffects(ref.dep);
}

export function ref(value: any) {
  return new refImpt(value);
}
