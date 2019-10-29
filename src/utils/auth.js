import Cookies from 'js-cookie'

const TokenKey = 'Auth-Token';

const expires = 30;

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token, {expires})
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
