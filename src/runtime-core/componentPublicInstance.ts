import { hasOwn } from "../shared";

const publicPropertiesMap: any = {
  $el: (i: any) => {
    return i.vnode.el;
  },
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    const { setupState, props } = instance;
    
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
