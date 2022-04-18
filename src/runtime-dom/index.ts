import { createRenderer } from "../runtime-core/renderer";

function createElement(type: string) {
  return document.createElement(type);
}

function patchProps(el: any, key: string, val: string) {
  const isOn = (prop: string): boolean => {
    return /^on[A-Z]/.test(prop);
  };

  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, val);
  } else {
    el.setAttribute(key, val);
  }
}

function insert(el: any, container: any) {
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});

export function createApp(...args: any[]) {
  // 使用 document 的 renderer
  return renderer.createApp(...args);
}

export * from "../runtime-core";
