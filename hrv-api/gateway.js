const config = require('../config')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    pool: { max: 7, min: 2, acquire: 30000, idle: 10000 },
})
const Models = require('../models')
const { Gateway } = Models

const api = {
    // 新增單一新定位器
    createGateway: async function (ctx) {
        const data = ctx.request.body
        try {
            const params = {
                gateway: data.gateway.toLowerCase(),
            }
            let result = await Gateway.create(params, { raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },

    // 取得定位器列表
    readGateways: async function (ctx) {
        try {
            let result = await Gateway.findAll({ raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },

    // 取單一定位器
    readGateway: async function (ctx) {
        const gateway = ctx.params.gateway
        try {
            let result = await Gateway.findOne({ where: { gateway: gateway }, raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },

    // 更新單一定位器的地點
    updateGateway: async function (ctx) {
        const data = ctx.request.body
        try {
            await Gateway.update(
                {
                    location: data.location,
                },
                {
                    where: {
                        gateway: data.gateway,
                    },
                }
            )
            ctx.response.body = '定位器地點已成功更新'
        } catch (error) {
            ctx.response.body = error
        }
    },

    // 刪除單一定位器
    deleteGateway: async function (ctx) {
        const gateway = ctx.params.gateway
        try {
            await Gateway.destroy({
                where: {
                    gateway: gateway,
                },
            })
            ctx.response.body = `已刪除定位器 ${gateway} .`
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
