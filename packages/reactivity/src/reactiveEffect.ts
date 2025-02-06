import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap(); // 存放依赖收集的关系

export const createDep = ((cleanup,key) => {
    const dep = new Map() as any;
    dep.cleanup = cleanup;
    dep.name = key;
    return dep;
})
export function track(target,key) {
    // activeEffect 有这个属性 说明key是在effect中访问的
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()))
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, dep = createDep(() => depsMap.delete(key),key))
        }
        trackEffect(activeEffect, dep);// 将activeEffect 放入dep中，后续根据可以根据值的变化，触发此dep中存放的effect
    }
}
// {
//     {name:'ws',age:22}:
//     {
//         name: {
//             effect,effect
//         },
//         age: {
//             effect
//         }
//     }
// }
export function trigger(target,key,value,oldValue){
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    let dep = depsMap.get(key);
    if (dep) {
        triggerEffects(dep);
    }
}