export function guid():string {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export function pick(o, ...fields) {
    var has = p => o.hasOwnProperty(p);
    var n = {};
    for (let p of fields)
        if (has(p))
            n[p] = o[p];
    return n;
}