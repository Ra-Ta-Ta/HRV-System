const { postgreServerUrl } = require('../config')
const { QueryTypes, Sequelize } = require('sequelize')
const sequelize = new Sequelize(postgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})

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
            ctx.response.body = data ? data : kuotung_data
        } catch (error) {
            ctx.response.body = error
        }
    },
    readAllCurrentData: async function (ctx) {
        try {
            let newest_5minute_hrv = `SELECT f.user_id, m.max_timestamp as timestamp, f.rmssd, f.sdnn, f.hrr, f.frequency
            FROM (
                SELECT user_id, max(timestamp) as max_timestamp
                FROM "5minute_hrv"
                WHERE timestamp BETWEEN ${new Date().setMinutes(new Date().getMinutes() - 5, 0, 0)} AND ${Date.now()}
                GROUP BY user_id
            ) m
            INNER JOIN "5minute_hrv" f ON 
                f.user_id = m.user_id AND
                f.timestamp = m.max_timestamp`
            let data = (
                await sequelize.query(
                    `
                    SELECT c.*, p.name, p.birthday, g.location, f.hrr, f.rmssd, f.sdnn, f.frequency
                    FROM current_data c
                    INNER JOIN personnel p ON p.user_id = c.user_id
                    LEFT JOIN gateway g ON g.gateway = c.gateway
                    LEFT JOIN (${newest_5minute_hrv}) f ON f.user_id = c.user_id;
                `,
                    { raw: true, type: QueryTypes.SELECT }
                )
            ).map((data) => ({
                ...data,
                timestamp: parseInt(data.timestamp, 10),
            }))
            ctx.response.body = data
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
