const { User } = require('../models/models')
const { getToken, getTokenRenewStatus, createNewToken, parseToken } = require('../utils/token')

const api = {
    // 使用者登入，並傳遞 JWT。
    login: async (ctx) => {
        let { username, password } = ctx.request.body

        try {
            let data = await User.findOne({
                attributes: ['username', 'password'],
                where: {
                    username: username,
                    password: password,
                },
                raw: true,
            })

            if (data) {
                ctx.response.body = {
                    status: 'success',
                    code: 200,
                    message: 'login success',
                    token: getToken({ username, password }),
                }
            } else {
                ctx.response.body = {
                    status: 'fail',
                    code: 400,
                    message: 'Parameter error',
                }
            }
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 檢查使用者 Token 狀態，有效則刷新使用期限。
    checkStatus: async (ctx) => {
        let { token } = ctx.request.body
        try {
            if (getTokenRenewStatus(token)) {
                ctx.response.body = {
                    status: 'success',
                    code: 200,
                    message: 'Token is still alive',
                    token: createNewToken(token),
                }
            } else {
                ctx.response.body = {
                    status: 'fail',
                    code: 400,
                    message: 'Token has been expired',
                }
            }
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
