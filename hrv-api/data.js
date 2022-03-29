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
const { Data, Personnel } = require('../models')

const api = {
    // 取得單一使用者區間資料
    readData: async function (ctx) {
        let { user_id, start_time, end_time } = ctx.params
        try {
            let all_data = await Data.findAll({
                attributes: ['hr', 'timestamp'],
                where: {
                    user_id: user_id,
                    timestamp: { [Op.between]: [start_time, end_time] },
                    hr: { [Op.gt]: 0 },
                },
                order: [['timestamp', 'ASC']],
                raw: true,
            })

            if (all_data.length > 0) {
                ctx.response.body = all_data
            }
            // 國統測試用
            else {
                all_data = await kuotung_sequelize.query(
                    `
                        SELECT d.hr, d.time as timestamp
                        FROM datacurrents_history d
                        WHERE d.pid = '${user_id}' AND d.hr > 0 AND d.time BETWEEN ${start_time} AND ${end_time}
                        ORDER BY d.time ASC;
                    `,
                    { raw: true, type: QueryTypes.SELECT }
                )

                ctx.response.body = all_data
            }
            // 國統測試用
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
