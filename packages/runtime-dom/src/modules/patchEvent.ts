
function createInvoker(value) {
    const invoker = (e) =>invoker.value()
    invoker.value = value;//更改invoker的value属性，可以修改对应的调用函数
    return invoker;
}

export default function patchEvent(el,name,nextValue){
    // vue_event_invoker
    const invokers = el._vei || (el._vei = {});
    //去掉on
    const eventName = name.slice(2).toLowerCase();
    const existingInvokers = invokers[name];
    if(nextValue){
        if (existingInvokers) {
            return existingInvokers.value = nextValue;
        }
        const invoker = invokers[name] = createInvoker(nextValue);
        return el.addEventListener(eventName, invoker)
    }
    if (existingInvokers) {
        el.removeEventListener(eventName, existingInvokers);
        invokers[name] = undefined;
    }
}