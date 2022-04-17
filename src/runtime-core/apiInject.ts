import { isFunction } from "../shared";
import { getCurrentInstance } from "./component";

export function provide(key: string, value: string) {
  const currentInstance = getCurrentInstance();

  // 在 setup内才能获取currentInstance，且才能调用provide
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;

    // 第一次调用provies时初始化
    if (provides === parentProvides) {
      // 通过prototype，为inject时自身找不到往上找
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

export function inject(key: string, defaultValue: any) {
  let currentInstance = getCurrentInstance();
  if (currentInstance) {
    // 从父组件的provides找
    const parentProvides = currentInstance.parent.provides;

    if (key in parentProvides) {
      return parentProvides[key];
    } else {
      if (isFunction(defaultValue)) {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
