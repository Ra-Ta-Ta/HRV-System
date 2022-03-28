const config = require('../config')
const Sequelize = require('sequelize')
const { QueryTypes, Op } = Sequelize
const kuotung_sequelize = new Sequelize(config.kuotungPostgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const { User } = require('../models')

const api = {
    login: async function (ctx) {
        let { username, password } = ctx.request.body
        const jsonToken = require('jsonwebtoken')
        const SECRET = 'gini'
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
                let token = jsonToken.sign(userToken, SECRET, { expiresIn: '1h' })
                ctx.response.body = {
                    code: 200,
                    message: 'success',
                    token,
                }
            } else {
                ctx.response.body = {
                    code: 400,
                    message: 'Parameter error',
                }
            }
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
