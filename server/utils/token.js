const JWT = require('jsonwebtoken')
const SECRET = require('../../config').gateway

const getTokenRenewStatus = (token) => {
    const { exp } = parseToken(token)
    return exp - Date.now() / 1000 > 0
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
        return {}
    }
}

module.exports = {
    getTokenRenewStatus,
    getToken,
    createNewToken,
    parseToken,
}
