import { currentInstance } from "./component";

export function provide(key,value) {
    if(!currentInstance) return;
    const parentProvides = currentInstance.parent?.provides;
    let provides = currentInstance.provides;

    if(parentProvides === provides) {
        //如果在子组件上新增了provides 需要copy一份全新的
        provides = currentInstance.provides = Object.create(provides);
    }
    provides[key] = value;
}
export function inject(key,defaultValue) {
    debugger
    if(!currentInstance) return;
    const provides = currentInstance.parent?.provides;
    if(provides && key in provides) {
        return provides[key]
    } else {
        return defaultValue;
    }

}