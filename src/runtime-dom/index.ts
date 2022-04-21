import { createRenderer } from "../runtime-core/renderer";

function createElement(type: string) {
  return document.createElement(type);
}

function patchProp(el: any, key: string, prevVal: string, nextVal: string) {
  const isOn = (prop: string): boolean => {
    return /^on[A-Z]/.test(prop);
  };

  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, nextVal);
  } else {
    if (nextVal === null || nextVal === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(child: any, parent: any, anchor: any = null) {
  parent.insertBefore(child, anchor);
}

function remove(child: any) {
  let parent = child.parentNode;
  parent && parent.removeChild(child);
}

function setElementText(el: any, text: string) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args: any[]) {
  // 使用 document 的 renderer
  return renderer.createApp(...args);
}

export * from "../runtime-core";
