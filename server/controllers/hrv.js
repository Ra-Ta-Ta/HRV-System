const { Op } = require('sequelize');
const {
	Five_minute_hrv,
	One_hour_hrv,
	One_day_hrv,
	One_week_hrv,
	One_month_hrv,
} = require('../models/models');

const api = {
	// Obtain the user's average HRV data every five minutes within a specific interval.
	read5MinuteHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await Five_minute_hrv.findAll({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				order: ['timestamp'],
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Obtain the user's average hourly HRV data within a specific interval.
	read1HourHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await One_hour_hrv.findAll({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Obtain the user's daily average HRV data within a specific interval.
	read1DayHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await One_day_hrv.findAll({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				raw: true,
			});

			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Get the user's average HRV data in the previous five minutes.
	readLatest5MinuteHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await Five_minute_hrv.findOne({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				order: ['timestamp', 'DESC'],
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Get the user's average HRV data of the previous day.
	readLatest1DayHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;

		try {
			let result = await One_day_hrv.findOne({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				order: [['timestamp', 'DESC']],
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Get the user's average HRV data for the previous week.
	readLatest1WeekHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await One_week_hrv.findOne({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				order: [['timestamp', 'DESC']],
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Get the user's average HRV data for the previous month.
	readLatest1MonthHrv: async (ctx) => {
		const { user_id, start_time, end_time } = ctx.params;
		try {
			let result = await One_month_hrv.findOne({
				where: {
					user_id: user_id,
					timestamp: { [Op.between]: [start_time, end_time] },
				},
				order: [['timestamp', 'DESC']],
				raw: true,
			});

			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},
};

module.exports = api;
