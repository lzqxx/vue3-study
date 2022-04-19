import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  function render(vnode: any, container: any) {
    patch(null, vnode, container, null);
  }

  function patch(n1: any, n2: any, container: any, parentComponent: any) {
    // n1为空则是新增，n1有值则是修改
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent: any
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        patch(null, subTree, container, instance);
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
        instance.isMounted = true;
      } else {
        // 需要比对新旧节点来更新
        const prevSubTree = instance.subTree;
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1: any, n2: any, container: any) {
    console.log("更新element");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 新vnode带上el
    let el = (n2.el = n1.el);
    patchProps(el, oldProps, newProps);
  }

  function patchProps(el: any, oldProps: any, newProps: any) {
    if (oldProps !== newProps) {
      // 有新prop或prop有改变
      for (const key in newProps) {
        let prevProp = oldProps[key];
        let nextProp = newProps[key];

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      // 有prop被移除
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function processFragment(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    mountChildren(n2, container, parentComponent);
  }

  function processText(n1: any, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function mountElement(vnode: any, container: any, parentComponent: any) {
    const { type } = vnode;
    const { children } = vnode;
    const { props } = vnode;
    const { shapeFlag } = vnode;

    // let el = (vnode.el = document.createElement(type));
    let el = (vnode.el = hostCreateElement(type));

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    // props
    for (const key in props) {
      const val = props[key];
      // if (isOn(key)) {
      //   const eventName = key.slice(2).toLowerCase();
      //   el.addEventListener(eventName, val);
      // } else {
      //   el.setAttribute(key, val);
      // }
      hostPatchProp(el, key, null, val);
    }

    // container.append(el);
    hostInsert(el, container);
  }

  function mountChildren(vnode: any, el: any, parentComponent: any) {
    vnode.children.forEach((v: any) => {
      patch(null, v, el, parentComponent);
    });
  }

  return {
    // 为了暴露render，封装函数把render当参数暴露出去
    createApp: createAppAPI(render),
  };
}
