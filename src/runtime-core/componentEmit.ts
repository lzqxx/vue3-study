import { camelize, toHandlerKey } from "../shared";

export function emit(instance: any, event: string, ...arg: any) {
  const { props } = instance;
  // emit("add") -> onAdd()
  // emit("add-foo") -> onAddFoo()

  const handleKey = toHandlerKey(camelize(event));
  const handle = props[handleKey];
  handle && handle(...arg);
}
