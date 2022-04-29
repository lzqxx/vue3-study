export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  // root 的 node 固定取 children[0],所以直接封装出来
  createRootCodegen(root);
}

function createTransformContext(root: any, option: any): any {
  const context = {
    root,
    nodeTransforms: option.nodeTransforms || [],
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

  traverseChildren(node, context);
}
function traverseChildren(node: any, context: any) {
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context);
  }
}
