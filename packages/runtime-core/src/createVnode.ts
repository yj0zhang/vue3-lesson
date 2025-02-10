import { isFunction, isObject, isString, ShapeFlags } from "@vue/shared";
import { isTeleport } from "./Teleport";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
export function isVnode(value){
    return value?.__v_isVnode
}

export function isSameVnode(n1,n2){
    return n1.type === n2.type &&n1.key===n2.key;
}

export default function createVnode(type,props,children?, patchFlag?){
    const shapeFlag = isString(type)
        ?ShapeFlags.ELEMENT
        :isTeleport(type)
        ?ShapeFlags.TELEPORT
        :isObject(type)
        ?ShapeFlags.STATEFUL_COMPONENT
        :isFunction(type)
        ?ShapeFlags.FUNCTIONAL_COMPONENT
        :0;
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        key:props?.key,//用户提供的，diff算法后面需要的key
        el: null,//虚拟节点需要对应的真实节点
        shapeFlag,
        ref: props?.ref,
        patchFlag,
    }
    if(currentBlock && patchFlag>0) {
        currentBlock.push(vnode);
    }
    if(children) {
        if(Array.isArray(children)) {
            vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
        } else if(isObject(children)) {
            vnode.shapeFlag|= ShapeFlags.SLOTS_CHILDREN;
        } else {
            children = String(children);
            vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;

        }
    }
    return vnode;
}

let currentBlock = null;
export function openBlock() {
    currentBlock = [];//用于收集动态节点的
}
export function closeBlock() {
    currentBlock = null;
}
export function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock;
    closeBlock();
    return vnode;
}
//block有收集虚拟节点的功能
export function createElementBlock(type,props,children,patchFlag?){
    return setupBlock(createVnode(type,props,children,patchFlag))
}

export function toDisplayString(value) {
    return isString(value)
        ? value
        : value === null
        ? ''
        : isObject(value)
        ? JSON.stringify(value)
        : String(value)
}

export {createVnode as createElementVNode};