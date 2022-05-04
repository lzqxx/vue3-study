import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast: any) {
  const context = createCodegenContext();
  const { push } = context;

  // 拼接成
  // const { toDisplayString: _toDisplayString } = Vue

  // return function render(_ctx, _cache) {
  //   return _toDisplayString(_ctx.message)
  // }

  // push(`const { toDisplayString: _toDisplayString } = Vue`);

  genFunctionPreamble(ast, context);

  // 拼接成
  // return function render(_ctx, _cache) {
  //   return "hi"
  // }
  push("return ");

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName}(${signature}) {`);

  push(" return ");
  genNode(ast.codegenNode, context);
  push(" }");

  return {
    code: context.code,
  };
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source: string) {
      context.code += source;
    },
    helper(key: any) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    default:
      break;
  }
}
function genFunctionPreamble(ast: any, context: any) {
  const VueBinging = "Vue";
  const { push } = context;

  if (ast.helpers.length > 0) {
    const aliasHelper = (s: symbol) => {
      return `${helperMapName[s]}: _${helperMapName[s]}`;
    };
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
    );
    push("\n\n");
  }
}

function genText(node: any, context: any) {
  const { push } = context;
  push(`"${node.content}"`);
}

function genInterpolation(node: any, context: any) {
  // _toDisplayString(_ctx.message)
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}

function genExpression(node: any, context: any) {
  const { push } = context;
  push(`${node.content}`);
}
