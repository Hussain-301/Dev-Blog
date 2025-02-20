function chunk(arr, parts) {
    const itemsInEachList = arr.length / parts;
    let result = [];
    
    for (let i = 0; i <= arr.length; i += parts) {
        result.push(arr.slice(i , i + parts));
    }
    
    return result;
}

console.log(chunk([1, 2, 3, 4, 5, 6], 2));