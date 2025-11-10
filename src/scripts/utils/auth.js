const USER_TOKEN_KEY = 'USER_TOKEN';

export function saveUserToken(token) {
    sessionStorage.setItem(USER_TOKEN_KEY, token);
}

export function getUserToken() {
    return sessionStorage.getItem(USER_TOKEN_KEY);
}

export function removeUserToken() {
    sessionStorage.removeItem(USER_TOKEN_KEY);
}

export function isUserLoggedIn() {
    return !!getUserToken();
}