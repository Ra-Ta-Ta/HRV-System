const JWT = require('jsonwebtoken')
const SECRET = require('../config').gateway

const getTokenRenewStatus = (token) => {
    const { exp } = parseToken(token)
    if (exp - Date.now() / 1000 > 5) {
        return true
    } else {
        return false
    }
}

const getToken = (payload = {}) => {
    return JWT.sign(payload, SECRET, { expiresIn: 60 * 30 })
}

const createNewToken = (token) => {
    const { username, password } = JWT.verify(token, SECRET)
    return getToken({ username, password })
}

const parseToken = (token) => {
    try {
        return JWT.verify(token, SECRET)
    } catch {
        console.log('token is expired')
        return {}
    }
}

module.exports = {
    getTokenRenewStatus,
    getToken,
    createNewToken,
    parseToken,
}
