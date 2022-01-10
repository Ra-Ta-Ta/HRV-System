const config = require('../config')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    pool: { max: 7, min: 2, acquire: 30000, idle: 10000 },
})
const { Data, Current_data, Personnel, Wristband } = require('../models')

const api = {
    // 新增單一新使用者
    createPersonnel: async function (ctx) {
        const data = ctx.request.body
        try {
            const personnel_data = {
                user_id: data.user_id,
                mac: null,
                name: data.name,
                sex: data.sex,
                birthday: new Date(data.birthday).getTime(),
                create_date: Date.now(),
                update_date: Date.now(),
            }
            const current_Data = {
                user_id: data.user_id,
                timestamp: Date.now(),
                mac: null,
                battery: 0,
                gateway: null,
                hr: 0,
                rssi: 0,
                pair_type: null,
                temperature: false,
            }
            let result = await Personnel.create(personnel_data, { raw: true })
            await Current_data.create(current_Data, { raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 取得使用者列表
    readPersonnels: async function (ctx) {
        try {
            let result = await Personnel.findAll({ raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 取得單一使用者
    readPersonnel: async function (ctx) {
        let user_id = ctx.params.user_id
        try {
            let result = await Personnel.findOne({ where: { user_id: user_id }, raw: true })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 更新使用者姓名、生日
    updatePersonnel: async function (ctx) {
        const data = ctx.request.body
        const birthday = new Date(data.birthday).getTime()

        try {
            await Personnel.update(
                {
                    name: data.name,
                    birthday: isNaN(birthday) ? data.birthday : birthday,
                    update_date: Date.now(),
                },
                {
                    where: {
                        user_id: data.user_id,
                    },
                    raw: true,
                }
            ).catch((err) => console.log(err))
            ctx.response.body = '使用者已成功更新'
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    updatePairedMac: async function (ctx) {
        const data = ctx.request.body
        try {
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
                },
                {
                    where: {
                        mac: data.mac,
                    },
                    raw: true,
                }
            )
            ctx.response.body = `使用者 ${data.user_id} 已成功配對手環 ${data.mac}.`
        } catch (error) {
            ctx.response.body = error.errors
        }
    },

    // 刪除單一使用者，並同步手環列表
    deletePersonnel: async function (ctx) {
        let user_id = ctx.params.user_id

        try {
            await Wristband.update({ user_id: null }, { where: { user_id: user_id }, raw: true })
            await Data.destroy({
                where: {
                    user_id: user_id,
                },
                raw: true,
            })
            await Current_data.destroy({
                where: {
                    user_id: user_id,
                },
                raw: true,
            })
            await Personnel.destroy({
                where: {
                    user_id: user_id,
                },
                // raw: true,
            })
            ctx.response.body = `已刪除使用者 ${user_id} .`
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
