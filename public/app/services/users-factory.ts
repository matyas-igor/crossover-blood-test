import {$http} from './xhr-factory';

export const UsersFactory = {
    getById: (id) => {
        return $http.get('user/' + id);
    },
    getByToken: (token) => {
        return $http.get('user/token/' + token);
    },
    save: (user) => {
        return $http.post('user', user);
    },
    update: (id, token, user) => {
        return $http.put('user/' + id + '/' + token, user);
    },
    getPoints: (xmin, xmax, ymin, ymax) => {
        return $http.get(`users?xmin=${xmin}&xmax=${xmax}&ymin=${ymin}&ymax=${ymax}`);
    }
};