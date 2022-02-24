const config = require('../config')
const { Sequelize, Op } = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
})
const { Five_minute_hrv, One_hour_hrv, One_day_hrv, One_week_hrv, One_month_hrv, Data } = require('../models')
const { FFT } = require('../formulas')

// 取得單一使用者多種區間心率資料
const api = {
    read5MinuteHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await Five_minute_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: ['timestamp'],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readLatest5MinuteHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await Five_minute_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: ['timestamp', 'DESC'],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    read1HourHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_hour_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    read1DayHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_day_hrv.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                raw: true,
            })

            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readLatest1DayHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params

        try {
            let result = await One_day_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readLatest1WeekHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_week_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })
            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readLatest1MonthHrv: async function (ctx) {
        const { user_id, start_time, end_time } = ctx.params
        try {
            let result = await One_month_hrv.findOne({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
                order: [['timestamp', 'DESC']],
                raw: true,
            })

            ctx.response.body = result
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
