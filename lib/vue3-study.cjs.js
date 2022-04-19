'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const EMPTY_OBJ = {};
function isObject(value) {
    return value !== null && typeof value === "object";
}
function isString(value) {
    return value !== null && typeof value === "string";
}
function isFunction(value) {
    return value !== null && typeof value === "function";
}
function hasChanged(value, oldValye) {
    return !Object.is(value, oldValye);
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
let activeEffect = null;
let shouldTrack = false; // 是否在收集依赖，用activeEffect可判断，但此处用此变量更有语义化
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        // fix: 解决stop再runner后，无法stop的问题
        if (!this.active) {
            this.active = true;
        }
        shouldTrack = true;
        activeEffect = this;
        // 触发get事件收集依赖
        let result = this.fn();
        // 依赖收集完后清掉
        activeEffect = null;
        shouldTrack = false;
        return result;
    }
    // 实际上是清除，不是单词stop停止的含义
    stop() {
        // 优化重复调用stop的性能问题
        if (this.active) {
            clearupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function clearupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function effect(fn, options) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function track(target, key) {
    if (!isTracking())
        return;
    // 对象依赖
    let targetDeps = targetMap.get(target);
    if (!targetDeps) {
        targetDeps = new Map();
        targetMap.set(target, targetDeps);
    }
    // 字段属性依赖
    let dep = targetDeps.get(key);
    if (!dep) {
        dep = new Set();
        targetDeps.set(key, dep);
    }
    trackEffects(dep);
}
function isTracking() {
    return shouldTrack && activeEffect;
}
function trackEffects(dep) {
    // 属性上增加一个依赖
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        // 依赖挂上属性依赖
        activeEffect.deps.push(dep);
    }
}
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

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createReadonlySetter();
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === exports.ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
        }
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
const shallowReactiveHandlers = {
    get: shallowReactiveGet,
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

exports.ReactiveFlags = void 0;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(exports.ReactiveFlags || (exports.ReactiveFlags = {}));
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
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
}
function isReactive(value) {
    return !!value[exports.ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    return !!value[exports.ReactiveFlags.IS_READONLY];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}

class refImpt {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 收集依赖
        if (isTracking()) {
            trackRefValue(this);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerRefValue(this);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
function trackRefValue(ref) {
    if (isTracking()) {
        // effect执行时 activeEffect 会赋值，然后收集依赖
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new refImpt(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
// 为了调用时省略.value，template时有用到
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            return Reflect.set(target, key, value);
        },
    });
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
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
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
        // 为了 render/template 中直接this.field，不用this.value.fielf
        instance.setupState = proxyRefs(setupResult);
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

// import { render } from "./renderer";
// export function createApp(rootComponent: any) {
//   return {
//     mount(rootContainer: any) {
//       const vnode = createVNode(rootComponent);
//       render(vnode, rootContainer)
//     }
//   }
// }
// 为了调用内部的render，封装成函数，把内部 render 传进来
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        // n1为空则是新增，n1有值则是修改
        switch (n2.type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
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
                instance.isMounted = true;
            }
            else {
                // 需要比对新旧节点来更新
                const prevSubTree = instance.subTree;
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log("更新element");
        console.log("n1", n1);
        console.log("n2", n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 新vnode带上el
        let el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 有新prop或prop有改变
            for (const key in newProps) {
                let prevProp = oldProps[key];
                let nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 有prop被移除
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function mountElement(vnode, container, parentComponent) {
        const { type } = vnode;
        const { children } = vnode;
        const { props } = vnode;
        const { shapeFlag } = vnode;
        // let el = (vnode.el = document.createElement(type));
        let el = (vnode.el = hostCreateElement(type));
        // children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent);
        }
        // props
        for (const key in props) {
            const val = props[key];
            // if (isOn(key)) {
            //   const eventName = key.slice(2).toLowerCase();
            //   el.addEventListener(eventName, val);
            // } else {
            //   el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val);
        }
        // container.append(el);
        hostInsert(el, container);
    }
    function mountChildren(vnode, el, parentComponent) {
        vnode.children.forEach((v) => {
            patch(null, v, el, parentComponent);
        });
    }
    return {
        // 为了暴露render，封装函数把render当参数暴露出去
        createApp: createAppAPI(render),
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (prop) => {
        return /^on[A-Z]/.test(prop);
    };
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        if (nextVal === null || nextVal === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    // 使用 document 的 renderer
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createReactiveObject = createReactiveObject;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.provide = provide;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
