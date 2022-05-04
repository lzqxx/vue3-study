import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { queueJobs } from "./scheduler";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode: any, container: any) {
    patch(null, vnode, container, null, null);
  }

  function patch(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // n1为空则是新增，n1有值则是修改
    switch (n2.type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1: any, n2: any) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
   
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(
    instance: any,
    initialVNode: any,
    container: any,
    anchor: any
  ) {
    instance.update = effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, proxy));

        patch(null, subTree, container, instance, anchor);
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
        const {next,vnode } = instance;
        // 更新组件信息
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        // 需要比对新旧节点来更新
        const prevSubTree = instance.subTree;
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy, proxy));
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    }, {
      scheduler (){
        queueJobs(instance.update);
      }
    });
  }

  function updateComponentPreRender(instance: any, nextVNode:any) {
    instance.vnode = nextVNode.vnode;
    instance.next = null;
    instance.props = nextVNode.props;
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 新vnode带上el
    let el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const { shapeFlag: prevShapeFlag } = n1;
    const { shapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // array转text
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unMountChildren(c1);
      }
      // array转text 或 text修改 时
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // text 转 array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // TODO: array 与 array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    parentAnchor: any
  ) {
    // 前端很多时候前后节点没变化
    // 先左右侧无变化对比，缩小后面遍历范围
    // 再中间区变化区比对
    let i = 0;
    let l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSomeVNodeType(n1: any, n2: any) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左侧相同对比
    while (i <= e1 && i <= e2) {
      let n1 = c1[i];
      let n2 = c2[i];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧相同对比
    while (i <= e1 && i <= e2) {
      let n1 = c1[e1];
      let n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 已找出中间不同区域
    // 处理左右侧变多或变少节点的情况
    // 变多时
    if (i > e1) {
      // 避免全相同
      if (i <= e2) {
        let nextPos = e2 + 1;
        // e2的后一位小于自身长度左侧加，否则末尾加
        let anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 变少
      while (i <= e1) {
        hostRemove(c1[e1].el);
        e1--;
      }
    } else {
      // 中间区域差异

      let s1 = i;
      let s2 = i;

      let toBePatched = e2 - s2 + 1;
      let patched = 0; // 新的能命中的数量
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      newIndexToOldIndexMap.fill(0);
      console.log("newIndexToOldIndexMap=", newIndexToOldIndexMap);

      // key 与节点映射关系
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        // 没 key 可能有问题
        if (c2[i].key) {
          keyToNewIndexMap.set(c2[i].key, i);
        }
      }

      // 删掉没了的
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // map 已全命中
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 没key,遍历c2中间区
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          // 删除
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 加1为了区分下标志为0时
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          patch(
            prevChild,
            c2[newIndex],
            container,
            parentComponent,
            parentAnchor
          );
          patched++;
        }
      }

      const increasingNewIndexSequence: any = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      // 因为insert是从某el前插入，所以从后往前加才能确保后el是正确位置，才不会有问题
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        // 旧中没找到
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // 递增子序列已全找到
          // 或找到非子序列的节点，则插入
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unMountChildren(children: any) {
    for (let i = 0; i < children.length; i++) {
      let el = children[i].el;
      hostRemove(el);
    }
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
    parentComponent: any,
    anchor: any
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1: any, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
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
      mountChildren(vnode.children, el, parentComponent, anchor);
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
    hostInsert(el, container, anchor);
  }

  function mountChildren(
    children: any,
    el: any,
    parentComponent: any,
    anchor: any
  ) {
    children.forEach((v: any) => {
      patch(null, v, el, parentComponent, anchor);
    });
  }

  return {
    // 为了暴露render，封装函数把render当参数暴露出去
    createApp: createAppAPI(render),
  };
}

/**
 * 最长递增子序列
 * @param arr
 * @returns
 */
function getSequence(arr: any) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
