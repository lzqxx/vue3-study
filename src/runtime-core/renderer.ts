import { isObject, isString } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment,Text } from "./vnode";

export function render(vnode: any, container: any) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  switch (vnode.type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
      }
      break;
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

function processFragment(vnode: any, container: any) {
  mountChildren(vnode, container);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function mountElement(vnode: any, container: any) {
  const { type } = vnode;
  const { children } = vnode;
  const { props } = vnode;
  const { shapeFlag } = vnode;

  let el = (vnode.el = document.createElement(type));

  // children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  const isOn = (prop: string): boolean => {
    return /^on[A-Z]/.test(prop);
  };

  // props
  for (const key in props) {
    const val = props[key];
    if (isOn(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

function mountChildren(vnode: any, el: any) {
  vnode.children.forEach((v: any) => {
    patch(v, el);
  });
}
