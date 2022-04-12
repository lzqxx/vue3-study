import { isObject, isString } from "../shared";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode: any, container: any) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  if (isObject(vnode.type)) {
    processComponent(vnode, container);
  } else if (isString(vnode.type)) {
    processElement(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode: any, container: any) {
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  patch(subTree, container);
  // console.log(instance.vnode === initialVNode); // true
  // console.log(instance.vnode === subTree); // false
  // createApp -> instance -> instance.render() -> subTree
  // patch -> 生成el -> vnode(subTree).el = el 
  // 子树有自己的vnode，为根组件实例instance的下级。
  // instance 根组件实例 render 后，得到子树（非组件实例vnode），patch 后得到子树 el。
  // 组件实例自身是没有实际 el，不用渲染到浏览器，所以把子树的 el 直接赋值给组件实例的vnode上，
  // 浏览器渲染时直接渲染子树的 el
  initialVNode.el = subTree.el;
  // instance.vnode.el = subTree.el;// 等同上面
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const { type } = vnode;
  const { children } = vnode;
  const { props } = vnode;

  let el = (vnode.el = document.createElement(type));
  if (isString(children)) {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }

  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
}

function mountChildren(vnode: any, el: any) {
  vnode.children.forEach((v: any) => {
    patch(v, el);
  });
}
