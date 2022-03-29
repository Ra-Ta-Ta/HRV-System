const config = require('../config')
const Sequelize = require('sequelize')
const { QueryTypes, Op } = Sequelize
const { User, Token } = require('../models')
const jsonToken = require('jsonwebtoken')
const SECRET = 'gini'

const api = {
    login: async function (ctx) {
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
                let userToken = { username: username }
                let token = jsonToken.sign(userToken, SECRET, { expiresIn: '0.5h' })
                await Token.upsert({ username: username, timestamp: Date.now() }, { fields: ['timestamp'] })
                ctx.response.body = {
                    status: 'success',
                    code: 200,
                    message: 'login success',
                    token,
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
    checkStatus: async function (ctx) {
        let { username } = ctx.request.body
        try {
            let data = await Token.findOne({
                where: {
                    username: username,
                    timestamp: { [Op.between]: [Date.now() - 86400000, Date.now()] },
                },
                raw: true,
            })

            if (data) {
                let userToken = { username: username }
                let token = jsonToken.sign(userToken, SECRET, { expiresIn: '0.5h' })
                ctx.response.body = {
                    status: 'success',
                    code: 200,
                    message: 'Token has been refreshed',
                    token,
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
