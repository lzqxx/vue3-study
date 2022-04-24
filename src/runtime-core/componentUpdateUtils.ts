/**
 * 是否更新组件
 * 只需要判断props是否改变
 * @param prevVNode 
 * @param nextVNode 
 */
export function shouldUpdateComponent(prevVNode:any, nextVNode:any) {
  const prevProps = prevVNode.props;
  const nextProps = nextVNode.props;

  // 如果新节点少了props，是不是会有问题？
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
