import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  // root 的 node 固定取 children[0],所以直接封装出来
  createRootCodegen(root);

  // 将content中的依赖提到root上
  root.helpers = [...context.helpers.keys()];
}

function createTransformContext(root: any, option: any): any {
  const context = {
    root,
    nodeTransforms: option.nodeTransforms || [],
    helpers: new Map(),
    helper(key: string) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function createRootCodegen(root: any) {
  root.codegenNode = root.children[0];
}

function traverseNode(node: any, context: any) {
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    let transformFun = nodeTransforms[i];
    transformFun(node);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }
}
function traverseChildren(node: any, context: any) {
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context);
  }
}
