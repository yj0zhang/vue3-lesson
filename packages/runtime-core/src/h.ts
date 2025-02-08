import { isObject } from "@vue/shared"
import createVnode, { isVnode } from "./createVnode";

/**
 * 
 * @param type 元素类型
 * @param propsOrChildren 属性或儿子
 * @param children 儿子
 * @returns vnode
 * 两个参数，第二个可能是属性或vnode
 *      第二个参数是数组或文本->儿子
 *      第二个参数是对象的->属性
 * 三个参数或以上
 *      第二个参数只能是属性（对象）
 *      第三个参数以后（包括第三个）都是儿子
 */
export function h(type, propsOrChildren?,children?){
    let l = arguments.length;
    if(l===2){
        if(isObject(propsOrChildren)&&!Array.isArray(propsOrChildren)){
            //属性或者vnode
            if(isVnode(propsOrChildren)) {
                return createVnode(type, null, [propsOrChildren])
            }else{
                return createVnode(type,propsOrChildren)
            }
        }
        // 儿子 数组或文本
        return createVnode(type,null,propsOrChildren)
    }else{
        if(l>3){
            children = Array.from(arguments).slice(2);
        }
        if(l===3&&isVnode(children)) {
            children = [children]
        }
        return createVnode(type,propsOrChildren,children)
    }
}

