const {
	Data,
	Current_data,
	Personnel,
	Wristband,
} = require('../models/models');

const api = {
	// Add a single user.
	createPersonnel: async (ctx) => {
		const data = ctx.request.body;
		try {
			const personnel_data = {
				user_id: data.user_id,
				mac: null,
				name: data.name,
				sex: data.sex,
				birthday: new Date(data.birthday).getTime(),
				create_date: Date.now(),
				update_date: Date.now(),
			};
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
			};
			let result = await Personnel.create(personnel_data, { raw: true });
			await Current_data.create(current_Data, { raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Get user list.
	readPersonnels: async (ctx) => {
		try {
			let result = await Personnel.findAll({ raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Get a single user.
	readPersonnel: async (ctx) => {
		let user_id = ctx.params.user_id;
		try {
			let result = await Personnel.findOne({
				where: { user_id: user_id },
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Update user name, birthday.
	updatePersonnel: async (ctx) => {
		const data = ctx.request.body;
		const birthday = new Date(data.birthday).getTime();

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
			);
			ctx.response.body = '使用者已成功更新';
		} catch (error) {
			ctx.response.body = error.message;
		}
	},
	// Update the user's paired wristband.
	updatePairedMac: async (ctx) => {
		const data = ctx.request.body;
		try {
			await Personnel.update(
				{
					mac: null,
				},
				{
					where: {
						mac: data.mac,
					},
					raw: true,
				}
			);
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
			);
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
			);
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
			);
			ctx.response.body = `User ${data.user_id} has successfully paired wristband ${data.mac}.`;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Delete a single user and synchronize the wristband list.
	deletePersonnel: async (ctx) => {
		let user_id = ctx.params.user_id;

		try {
			await Wristband.update(
				{ user_id: null },
				{ where: { user_id: user_id }, raw: true }
			);
			await Data.destroy({
				where: {
					user_id: user_id,
				},
				raw: true,
			});
			await Current_data.destroy({
				where: {
					user_id: user_id,
				},
				raw: true,
			});
			await Personnel.destroy({
				where: {
					user_id: user_id,
				},
				// raw: true,
			});
			ctx.response.body = `User ${user_id} has been deleted.`;
		} catch (error) {
			ctx.response.body = error;
		}
	},
};

module.exports = api;
