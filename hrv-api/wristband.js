const config = require('../config')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    pool: { max: 7, min: 2, acquire: 30000, idle: 10000 },
})
const Models = require('../models')
const { Wristband, Personnel } = Models

const api = {
    // 新增單一新手環
    createWristband: async function (ctx) {
        const data = ctx.request.body
        try {
            const params = {
                mac: data.mac.toLowerCase(),
                pair_type: data.pair_type.toUpperCase(),
            }
            let result = await Wristband.create(params, { raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 取得手環列表
    readWristbands: async function (ctx) {
        try {
            let result = await Wristband.findAll({ raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 取得單一手環
    readWristband: async function (ctx) {
        let mac = ctx.params.mac
        try {
            let result = await Wristband.findOne({ where: { mac: mac }, raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 更新手環型號及欲配對的使用者
    updateWristband: async function (ctx) {
        const data = ctx.request.body
        try {
            await Wristband.update(
                {
                    user_id: null,
                },
                {
                    where: {
                        user_id: data.user_id,
                    },
                    raw: true,
                }
            )
            await Wristband.update(
                {
                    user_id: data.user_id,
                    pair_type: data.pair_type,
                },
                {
                    where: {
                        mac: data.mac,
                    },
                    raw: true,
                }
            )
            await Personnel.update(
                {
                    mac: null,
                },
                {
                    where: {
                        mac: data.mac,
                    },
                    raw: true,
                }
            )
            await Personnel.update(
                {
                    mac: data.mac,
                },
                {
                    where: {
                        user_id: data.user_id,
                    },
                    raw: true,
                }
            )

            ctx.response.body = '手環已成功更新'
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 刪除單一手環，並同步使用者列表
    deleteWristband: async function (ctx) {
        let mac = ctx.params.mac
        try {
            await Personnel.update({ mac: null }, { where: { mac: mac }, raw: true })
            await Wristband.destroy({
                where: {
                    mac: mac,
                },
                raw: true,
            })
            ctx.response.body = `已刪除手環 ${mac} .`
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
