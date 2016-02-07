declare var SETTINGS:any;
declare var io:any;

export class Socket {
    private static _updateListeners:Array<Function> = [];
    private static socket = io(SETTINGS["server-api"].url + '/');

    public static subscribe(cb) {
        this._updateListeners.push(cb);
        let listenerIndex = this._updateListeners.length - 1;
        return () => {
            this._updateListeners[listenerIndex] = null;
        };
    }

    public static emit(data) {
        this._updateListeners.forEach(cb => {cb ? cb(data) : null});
    }

    public static init() {
        this.socket.on('points', data => {
            console.log('Message ->', data);
            this.emit(data);
        });
    }
}