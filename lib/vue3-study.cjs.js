'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * 虚拟节点上的标识枚举
 */
var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

function isObject(value) {
    return value !== null && typeof value === "object";
}
function isString(value) {
    return value !== null && typeof value === "string";
}
function isFunction(value) {
    return value !== null && typeof value === "function";
}
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
}
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
function toHandlerKey(str) {
    return str ? "on" + capitalize(str) : "";
}

const targetMap = new Map();
function trigger(target, key) {
    const targetDeps = targetMap.get(target);
    if (!targetDeps)
        return;
    const deps = targetDeps.get(key);
    if (!deps || deps.size === 0)
        return;
    triggerEffects(deps);
}
function triggerEffects(dep) {
    dep.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createReadonlySetter();
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 不嵌套
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            // 嵌套
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
function createReadonlySetter() {
    return function set(target, key, value) {
        console.warn(`key:${key} 是 readonly, 不允许修改`);
        return true;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet,
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: readonlySet,
};

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function createReactiveObject(target, baseHandlers) {
    return new Proxy(target, baseHandlers);
}
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}

function emit(instance, event, ...arg) {
    const { props } = instance;
    // emit("add") -> onAdd()
    // emit("add-foo") -> onAddFoo()
    const handleKey = toHandlerKey(camelize(event));
    const handle = props[handleKey];
    handle && handle(...arg);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => {
        return i.vnode.el;
    },
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

// export function initSlots(instance: any, slots: any) {
//   if (slots) {
//     instance.slots = createVNode(Fragment,{},Array.isArray(slots) ? slots : [slots]) ;
//   }
// }
function initSlots(instance, children) {
    // slots
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // 为每个具名插槽定义函数，并将作用域插槽作为参数
    // 具名插槽函数的render具体实现由调用方实现，调用方使用可用createVNode方法，控制反转
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
// 全转成数组统一处理
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        provides: parent ? parent.provides : {},
        parent,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // props 浅只读
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 全局变量赋值通过函数方式，方便后续问题排查、断点调试
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
/**
 * 创建虚拟节点
 * @param type vue组件的optoins
 * @param props
 * @param children
 * @returns
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (isString(vnode.children)) {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    // 组件且children是数组
    // if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    //   if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //     vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    //   }
    // }
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

function render(vnode, container) {
    patch(vnode, container, null);
}
function patch(vnode, container, parentComponent) {
    switch (vnode.type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container, parentComponent);
            }
            else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance);
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
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function mountElement(vnode, container, parentComponent) {
    const { type } = vnode;
    const { children } = vnode;
    const { props } = vnode;
    const { shapeFlag } = vnode;
    let el = (vnode.el = document.createElement(type));
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el, parentComponent);
    }
    const isOn = (prop) => {
        return /^on[A-Z]/.test(prop);
    };
    // props
    for (const key in props) {
        const val = props[key];
        if (isOn(key)) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, el, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, el, parentComponent);
    });
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    // 在 setup内才能获取currentInstance，且才能调用provide
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 第一次调用provies时初始化
        if (provides === parentProvides) {
            // 通过prototype，为inject时自身找不到往上找
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父组件的provides找
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
