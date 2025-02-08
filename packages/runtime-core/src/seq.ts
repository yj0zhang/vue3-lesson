//获取最长递增子序列的索引
export default function getSequence(arr){
    const result = [0];
    const p = result.slice(0);//用于存放前驱索引
    let start,end,middle;
    const len =arr.length;
    for(let i = 0; i<len;i++){
        const arrI = arr[i];
        if(arrI !== 0){//为了vue3处理掉数组中0的情况
            //拿出result数组的最后一项，和当前一项做比对
            let resultLast = result[result.length -1];
            if(arr[resultLast]<arrI) {
                p[i]=resultLast;
                result.push(i);
                continue
            }
        }
        //二分查找
        start = 0;
        end = result.length - 1
        while(start<end){
            middle = (start+end)/2 | 0;
            if(arr[result[middle]]<arrI){
                start = middle+1;
            } else {
                end = middle;
            }
        }
        //----
        if(arrI < arr[result[start]]){
            p[i] = result[start - 1];
            result[start] = i;
        }
    }
    //创建前驱节点，进行倒序追溯（因为最后一项肯定是对的）
    let l = result.length;
    let last = result[l-1];
    while(l-- >0){
        result[l] = last;
        last = p[last];
    }
    return result;
}