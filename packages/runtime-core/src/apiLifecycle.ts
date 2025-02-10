import { currentInstance, setCurrentInstance, unsetCurrentInstance } from "./component";

export const enum LifeCycle {
    //
    BEFOR_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFOR_UPDATED = 'bu',
    UPDATED = 'u',
}

function createHook(type) {
    //target = currentInstance 将当前实例存到了此钩子上
    return (hook, target = currentInstance)=>{
        if(target) {
            const hooks = target[type] || (target[type] = []);
            const wrapHook = () => {
                // 在钩子执行前，对实例进行校正处理
                setCurrentInstance(target)
                hook.call(target);
                unsetCurrentInstance();
            }
            hooks.push(wrapHook);
        }
    }
}

export const onBeforeMount = createHook(LifeCycle.BEFOR_MOUNT);
export const onMounted = createHook(LifeCycle.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycle.BEFOR_UPDATED);
export const onUpdated = createHook(LifeCycle.UPDATED);

export function invokeArray(fns) {
    for(let i = 0; i< fns.length;i++) {
        fns[i]();
    }
}