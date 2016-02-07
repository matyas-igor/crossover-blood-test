import {UsersFactory} from './users-factory';
import {Cookie} from './cookie-factory';
import {guid, pick} from './utils-service';

export class User {

    public static entity:Object = null;

    private static _checkPromise:Promise<any> = null;
    private static _updateListeners:Array<Function> = [];

    public static check() {
        if (this._checkPromise) {
            return this._checkPromise;
        }

        this._checkPromise = new Promise((resolve, reject) => {
            if (this.entity) {
                resolve(this.entity);
            } else {
                // check if user already was on site
                var userId:string = Cookie.getCookie('user_id');
                var token:string = Cookie.getCookie('user_token');

                if (userId && token) {
                    // user exists
                    UsersFactory.getByToken(token)
                        .then(res => {
                            console.log('Res', res);
                            if (res.user && res.user.token == token && res.user.user_id == userId) {
                                this._setUser(res.user);
                                resolve(this.entity);
                            } else {
                                this._clearUser();
                                reject('Wrong user');
                            }

                        })
                        .catch(err => {
                            this._clearUser();
                            reject(err);
                        });
                } else {
                    // generate new user
                    var userId:string = guid();

                    UsersFactory.save({user_id: userId})
                        .then(res => {
                            this._setUser(res.user);
                            resolve(this.entity);
                        })
                        .catch(err => {
                            this._clearUser();
                            reject(err);
                        });
                }
            }
        });

        return this._checkPromise;
    }

    public static setType(newType:string) {
        return new Promise((resolve, reject) => {
            if (!this.entity) {
                reject(null);
            } else {
                UsersFactory.update(this.entity['user_id'], this.entity['token'], {type: newType})
                    .then(res => {
                        this._setUser(res.user);
                        resolve(this.entity);
                    })
                    .catch(err => {
                        this._clearUser();
                        reject(err);
                    });
            }
        });
    }

    public static update(newUser, point = null) {
        return new Promise((resolve, reject) => {
            if (!this.entity) {
                reject(null);
                return;
            }

            let options = pick(newUser, 'firstName', 'lastName', 'email', 'address', 'phoneNumber', 'bloodGroup', 'donation');

            if (point && point.geometry) {
                options['x'] = point.geometry.x;
                options['y'] = point.geometry.y;
                options['donation'] = true;
            }

            UsersFactory.update(this.entity['user_id'], this.entity['token'], options)
                .then(res => {
                    this._setUser(res.user);
                    resolve(this.entity);
                })
                .catch(err => {
                    this._clearUser();
                    reject(err);
                });
        });

    }

    public static subscribe(cb) {
        this._updateListeners.push(cb);
        let listenerIndex = this._updateListeners.length - 1;
        return () => {
            this._updateListeners[listenerIndex] = null;
        };
    }

    public static getPoints(xmin, xmax, ymin, ymax) {
        return UsersFactory.getPoints(xmin, xmax, ymin, ymax);
    }
    public static getUser(userId) {
        return UsersFactory.getById(userId);
    }

    private static _setUser(newUser:Object) {
        console.log('SET USER', newUser);
        Cookie.setCookie('user_id', newUser['user_id']);
        if (newUser['token']) {
            Cookie.setCookie('user_token', newUser['token']);
        }
        this.entity = newUser;
        this._updateListeners.forEach(cb => {cb ? cb(this.entity) : null});
    }
    private static _clearUser() {
        Cookie.deleteCookie('user_id');
        Cookie.deleteCookie('token');
        this.entity = null;
        this._updateListeners.forEach(cb => {cb ? cb(this.entity) : null});
    }
}