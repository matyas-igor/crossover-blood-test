import {Settings} from './settings-factory'

export const $http = {
    get: function (url:string) {
        return _sendRequest(url, null, 'GET');
    },
    post: function (url:string, payload:any) {
        return _sendRequest(url, payload, 'POST');
    },
    put: function (url:string, payload:any) {
        return _sendRequest(url, payload, 'PUT');
    },
    delete: function (url:string) {
        return _sendRequest(url, null, 'DELETE');
    }
};

// borrowed from https://github.com/afj176/ng2-express-starter/blob/master/public/components/contact/Contact.js#L36
function _sendRequest(url:string, payLoad:any, type:string):Promise<any> {
    return new Promise<any>((resolve, reject) => {

        var req = new XMLHttpRequest();
        req.open(type, Settings.apiUrl + url);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        req.onload = function () {
            if (req.status == 200) {
                resolve(JSON.parse(req.response));
            } else {
                console.error('API ['+Settings.apiUrl + url+'] / ' + req.response);
                reject(req.response);
            }
        };

        req.onerror = function () {
            console.error('API ['+Settings.apiUrl + url+'] / ' + req.response);
            reject(req.response);
        };

        if (payLoad) {
            req.send(JSON.stringify(payLoad));
        } else {
            req.send(null);
        }
    });
}