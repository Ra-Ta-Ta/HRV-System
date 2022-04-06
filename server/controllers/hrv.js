const { Op } = require('sequelize')
const { Five_minute_hrv, One_hour_hrv, One_day_hrv, One_week_hrv, One_month_hrv } = require('../models/models')

const api = {
    // 取得使用者區間內每五分鐘的平均 HRV 資料
    read5MinuteHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await Five_minute_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: ['timestamp'],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者區間內每小時的平均 HRV 資料
    read1HourHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_hour_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者區間內每日的平均 HRV 資料
    read1DayHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_day_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                raw: true,
            })

            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者前五分鐘的平均 HRV 資料
    readLatest5MinuteHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await Five_minute_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: ['timestamp', 'DESC'],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者前日的平均 HRV 資料
    readLatest1DayHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params

        try {
            let result = await One_day_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者前週的平均 HRV 資料
    readLatest1WeekHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_week_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error
        }
    },
    // 取得使用者前月的平均 HRV 資料
    readLatest1MonthHrv: async (ctx) => {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_month_hrv.findOne({
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
