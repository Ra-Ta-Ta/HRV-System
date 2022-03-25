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

        try {
            let data = await User.findOne({
                attributes: ['username', 'password'],
                where: {
                    username: username,
                    password: password,
                },
                raw: true,
            })

            return data
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
