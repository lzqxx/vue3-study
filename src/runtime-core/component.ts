import { shallowReadonly } from "../reactivity/reactive";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: null,
  };

  return component;
}

export function setupComponent(instance: any) {
  // TODO
  initProps(instance, instance.vnode.props);
  // initSlots()
  setupStatefulComponent(instance);
}

function initProps(instance: any, rawProps: any) {
  instance.props = rawProps || {};
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    // props 浅只读
    const setupResult = setup(shallowReadonly( instance.props));
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function Object
  // TODO function
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}
