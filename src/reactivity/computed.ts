import { ReactiveEffect } from "./effect";

// computed 相当于特殊的 effect
// 响应式数据更新后才触发依赖
class ComputedRefImpl {
  private _dirty: boolean = true;
  private _value: any;
  private _effect: ReactiveEffect;
  public dep: any = new Set();

  constructor(getter: Function) {
    this._effect = new ReactiveEffect(getter, () => {
      // 在this._effect.run()时收集了依赖
      // 响应式值改变，下次computed不用缓存
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // 缓存， 值没变直接取缓存的值
    if (this._dirty) {
      this._dirty = false;
      // 依赖收集并执行获取新值
      this._value = this._effect.run();
    }

    return this._value;
  }
}

export function computed(getter: Function) {
  return new ComputedRefImpl(getter);
}
