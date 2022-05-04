import { baseCompile } from "./compiler-core/src";
import { registerRuntimeCompiler } from "./runtime-core/component";
import * as runtimeDom from "./runtime-dom";

export * from "./runtime-dom";

function compileToFunction(template: string) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
