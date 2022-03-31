const { Op } = require('sequelize')
const { Five_minute_hr, One_day_hr, One_month_hr } = require('../models/models')

// 取得單一使用者多種區間心率資料
const api = {
    read5MinuteHr: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result
            if (start_time !== undefined && end_time !== undefined) {
                result = await Five_minute_hr.findAll({
                    where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                    raw: true,
                })
            } else {
                result = await Five_minute_hr.findAll({
                    where: { user_id: user_id },
                    raw: true,
                })
            }
            ctx.response.body = result.length > 0 ? result : null
        } catch (error) {
            ctx.response.body = error
        }
    },
    readLatest1DayHr: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_day_hr.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    readLatest1MonthHr: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_month_hr.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
