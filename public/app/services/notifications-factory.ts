
export class Notifications {
    private static _updateListeners:Array<Function> = [];

    public static subscribe(cb) {
        this._updateListeners.push(cb);
        let listenerIndex = this._updateListeners.length - 1;
        return () => {
            this._updateListeners[listenerIndex] = null;
        };
    }

    public static add(notification) {
        this._updateListeners.forEach(cb => {cb ? cb(notification) : null});
    }
}