
/**
 * 创建虚拟节点
 * @param type vue组件的optoins
 * @param props 
 * @param children 
 * @returns 
 */
export function createVnode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
  };

  return vnode;
}
