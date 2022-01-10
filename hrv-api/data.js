const config = require('../config')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const { Data } = require('../models')

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
                },
                raw: true,
            })
            let result = []
            if (all_data.length > 0) {
                all_data.forEach((data) => {
                    let { timestamp, hr } = data
                    if (hr > 0) {
                        result.push({
                            timestamp: timestamp,
                            hr: hr,
                        })
                    }
                })
                result.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
            }

            ctx.response.body = result.length > 0 ? result : null
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
