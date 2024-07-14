const { User } = require('../models/models');
const {
	getToken,
	getTokenRenewStatus,
	createNewToken,
	parseToken,
} = require('../utils/token');

const api = {
	// Handles user login by validating credentials.
	login: async (ctx) => {
		let { username, password } = ctx.request.body;

		try {
			let data = await User.findOne({
				attributes: ['username', 'password'],
				where: {
					username: username,
					password: password,
				},
				raw: true,
			});

			if (data) {
				ctx.response.body = {
					status: 'success',
					code: 200,
					message: 'login success',
					token: getToken({ username, password }),
				};
			} else {
				ctx.response.body = {
					status: 'fail',
					code: 400,
					message: 'Parameter error',
				};
			}
		} catch (error) {
			ctx.response.body = error;
		}
	},
	// Check the user's Token status and refresh the validity period if it has not expired.
	checkStatus: async (ctx) => {
		let { token } = ctx.request.body;
		try {
			if (getTokenRenewStatus(token)) {
				ctx.response.body = {
					status: 'success',
					code: 200,
					message: 'Token is still alive',
					token: createNewToken(token),
				};
			} else {
				ctx.response.body = {
					status: 'fail',
					code: 400,
					message: 'Token has been expired',
				};
			}
		} catch (error) {
			ctx.response.body = error;
		}
	},
};

module.exports = api;
