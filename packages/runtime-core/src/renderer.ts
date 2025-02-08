import { ShapeFlags } from "@vue/shared";
import { Fragment, isSameVnode } from "./createVnode";
import getSequence from "./seq";
import { Text } from "./createVnode";

export function createRenderer(renderOptions){
    // core中不关心如何渲染，可以跨平台
    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp
    } = renderOptions;

    const mountChildren = (children,container)=> {
        for(let i=0;i<children.length;i++){
            // children[i]可能是纯文本元素 todo
            patch(null, children[i],container)
        }
    }

    const mountElement = (vnode,container, anchor) => {
        const {type,children,props,shapeFlag} = vnode;
        //第一次渲染的时候，需要让虚拟节点与真实的dom关联：vnode.el=真实dom
        //第二次渲染新vnode，可以和上次的vnode做对比，之后更新对应的el元素，
        let el = vnode.el = hostCreateElement(type);
        if(props) {
            for(let key in props) {
                hostPatchProp(el, key,null,props[key])
            }
        }
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children)
        } else if(shapeFlag&ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children,el)
        }
        hostInsert(el, container, anchor)
    }
    const processElement = (n1,n2, container, anchor)=>{
        if(n1===null){
            //初始化
            mountElement(n2,container, anchor)
        } else {
            //打补丁：比较差异并更新
            patchElement(n1,n2,container)
        }
    }
    const patchProps = (oldProps, newProps,el) => {
        for(let key in newProps){
            hostPatchProp(el,key,oldProps[key], newProps[key])
        }
        for(let key in oldProps){
            if(!(key in newProps)) {
                hostPatchProp(el,key,oldProps[key], null)
            }
            
        }
    }
    const unmountChildren = (children)=>{
        for(let i = 0;i<children.length;i++){
            unmount(children[i])
        }
    }
    //全量diff（递归），还有一种是快速diff（靶向更新）
    const patchKeyedChildren = (c1,c2,el)=> {
        //比较两个儿子的差异，更新el
        //先从头开始比，再从尾部比较，确定中间不一样的范围
        let i = 0;//开始比对的索引
        let e1 = c1.length -1;//第一个数组的尾部索引
        let e2 = c2.length -1;//第二个数组的尾部索引
        while(i<=e1&&i<=e2){
            const n1=c1[i],n2=c2[i];
            if(isSameVnode(n1,n2)) {
                patch(n1,n2,el);//更新当前节点的属性和儿子（递归比较子节点）
            } else {
                break;
            }
            i++;
        }
        // console.log(i,e1,e2);//比对范围
        while(i<=e1&&i<=e2){
            const n1 = c1[e1];
            const n2=c2[e2];
            if(isSameVnode(n1,n2)) {
                patch(n1,n2,el);
            } else {
                break;
            }
            e1--;
            e2--;
        }
        // console.log(i,e1,e2);
        // 处理增加和删除的特殊情况
        if(i>e1) {
            // 新增
            if(i<=e2){
                let nextPos = e2+1;//看一下当前下一个元素是否存在
                let anchor = c2[nextPos]?.el;
                while(i<=e2) {
                    patch(null,c2[i],el,anchor);
                    i++;
                }

            }
        }else if(i>e2) {
            // 删除
            if(i<=e1){
                while(i<=e1){
                    unmount(c1[i])
                    i++;
                }
            }
        } else {
            console.log(i,e1,e2);
            let s1=i;
            let s2=i;

            const keyToNewIndexMap = new Map();//做一个映射表用于快速查找，看老的是否在新的里面还有，没有就删除，有就更新

            let toBePatched = e2-s2+1;//要倒序插入的个数

            let newIndexToOldMapIndex = new Array(toBePatched).fill(0);
            //根据新的节点，找到对应老的位置
            //
            for(let i = s2;i<=e2;i++) {
                const vnode = c2[i];
                keyToNewIndexMap.set(vnode.key,i)
            }
            console.log(keyToNewIndexMap)
            for(let i = s1;i<=e1;i++) {
                const vnode = c1[i];
                const newIndex = keyToNewIndexMap.get(vnode.key);//通过key找到对应的索引
                if(newIndex === undefined) {
                    //新的索引没有，老的不在新的里面，删除老的
                    unmount(vnode);
                } else {
                    console.log(newIndex-s2,i)
                    // 老的在新的里面，newIndex是在新的里面的索引，i是老的索引
                    //newIndexToOldMapIndex中默认值是0，i+1后，保证值为0代表没有老的
                    newIndexToOldMapIndex[newIndex-s2] = i+1;
                    //比较前后节点的差异，更新属性和儿子
                    patch(vnode,c2[newIndex],el);
                }
            }
            console.log(newIndexToOldMapIndex)

            let increasingSeq = getSequence(newIndexToOldMapIndex);
            let j = increasingSeq.length - 1;
            //调整顺序 按照新的元素顺序，倒序插入
            // 插入过程中，新的元素可能多，需要创建
            for(let i = toBePatched - 1;i>=0;i--){
                let newIndex = s2+i;
                let anchor = c2[newIndex+1]?.el;
                let vnode = c2[newIndex];
                if(!vnode.el){
                    patch(null,vnode, el, anchor);
                } else {
                    if(i === increasingSeq[j]) {
                        j--;
                    }else{
                        hostInsert(vnode.el,el,anchor);
                    }
                }
            }
        }
    }
    const patchChildren = (n1,n2,el) => {
        //
        const c1 = n1.children;
        const c2 = n2.children;

        const preShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if(preShapeFlag & ShapeFlags.ARRAY_CHILDREN){
                unmountChildren(c1);
            }
            if(c1!==c2){
                hostSetElementText(el, c2)
            }
        } else {
            if(preShapeFlag&ShapeFlags.ARRAY_CHILDREN){
                if(shapeFlag&ShapeFlags.ARRAY_CHILDREN){
                    //全量diff 两个数组的比对
                    patchKeyedChildren(c1,c2,el);
                }else {
                    unmountChildren(c1)
                }
            } else {
                if(preShapeFlag &ShapeFlags.TEXT_CHILDREN){
                    hostSetElementText(el, '')
                }
                if(shapeFlag &ShapeFlags.ARRAY_CHILDREN){
                    mountChildren(c2,el);
                }
            }
        }
    }
    const patchElement = (n1,n2,container)=>{
        //比较元素属性和子节点的差异，
        let el = n2.el = n1.el;//复用dom元素
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        patchProps(oldProps,newProps, el);//跟新属性
        patchChildren(n1,n2,el)
    }
    const processText = (n1,n2,container)=>{
        if(n1===null){
            hostInsert(n2.el = hostCreateText(n2.children), container);
        } else{
            const el = (n2.el = n1.el)
            if(n1.children !== n2.children){
                hostSetText(el,n2.children);
            }
        }
    }
    const processFragment = (n1,n2,container)=>{
        if(n1===null){
            mountChildren(n2.children, container)
        } else{
            patchChildren(n1,n2,container)
        }
    }
    
    // 渲染&更新
    const patch = (n1,n2,container, anchor = null) => {
        if (n1===n2) {
            return;//同一个元素
        }
        if(n1&&!isSameVnode(n1,n2)){
            unmount(n1);
            n1=null;//之后执行n2的初始化
        }
        const {type} = n2;
        switch (type) {
            case Text:
                processText(n1,n2,container);
                break;
            case Fragment:
                processFragment(n1,n2,container);
                break;
            default: 
                processElement(n1,n2, container, anchor);//对元素处理
        }
    }

    const unmount = (vnode)=>{
        if(vnode.type === Fragment) {
            unmountChildren(vnode.children);
        }else{
            hostRemove(vnode.el)
        }
    }
    //多次调用render 会进行虚拟节点的比较，再进行更新
    const render =(vnode, container) => {
        if(vnode === null) {
            //移除当前容器中的dom元素
            console.log(vnode, container._vnode)
            unmount(container._vnode)
        } else{
            //将虚拟节点变成真实节点渲染
            patch(container._vnode || null,vnode,container);
            //缓存上次的vnode
            container._vnode = vnode;
        }
    }
    return {
        render,
    }
}