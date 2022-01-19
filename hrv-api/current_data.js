const config = require('../config')
const Sequelize = require('sequelize')
const { Op, QueryTypes } = Sequelize
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const { Current_data, Personnel, Gateway, Five_minute_hrv } = require('../models')

const api = {
    // 取得單一使用者即時資料
    readCurrentData: async function (ctx) {
        const { user_id } = ctx.params
        try {
            const [data] = await sequelize.query(
                `
                    SELECT c.*, p.name, p.birthday, p.sex, g.location
                    FROM current_data c
                    INNER JOIN personnel p ON p.user_id = c.user_id
                    LEFT JOIN gateway g ON g.gateway = c.gateway
                    WHERE c.user_id = '${user_id}';
                `,
                { raw: true, type: QueryTypes.SELECT }
            )
            ctx.response.body = data
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readAllCurrentData: async function (ctx) {
        try {
            const data = await sequelize.query(
                `
                    SELECT c.*, p.name, p.birthday, g.location, f.hrr, f.rmssd, f.sdnn, f.ratio
                    FROM current_data c
                    INNER JOIN personnel p ON p.user_id = c.user_id
                    LEFT JOIN gateway g ON g.gateway = c.gateway
                    LEFT JOIN (
                        SELECT *
                        FROM "5minute_hrv" 
                        WHERE timestamp BETWEEN ${Date.now() - 60000} AND ${Date.now()}
                    ) f ON f.user_id = c.user_id;
                `,
                { raw: true, type: QueryTypes.SELECT }
            )
            ctx.response.body = data.length > 0 ? data : null
        } catch (error) {
            console.log(error)
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
