const { Wristband, Personnel } = require('../models/models');

const api = {
	// Create a new wristband
	createWristband: async (ctx) => {
		const data = ctx.request.body;
		try {
			const params = {
				mac: data.mac.toLowerCase(),
				pair_type: data.pair_type.toUpperCase(),
			};
			let result = await Wristband.create(params, { raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Retrieve wristband list
	readWristbands: async (ctx) => {
		try {
			let result = await Wristband.findAll({ raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Retrieve a single wristband
	readWristband: async (ctx) => {
		let mac = ctx.params.mac;
		try {
			let result = await Wristband.findOne({
				where: { mac: mac },
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Update wristband model and intended paired user
	updateWristband: async (ctx) => {
		const data = ctx.request.body;
		try {
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
					pair_type: data.pair_type,
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

			ctx.response.body = 'Wristband updated successfully';
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Delete a single wristband and synchronize the user list
	deleteWristband: async (ctx) => {
		let mac = ctx.params.mac;
		try {
			await Personnel.update(
				{ mac: null },
				{ where: { mac: mac }, raw: true }
			);
			await Wristband.destroy({
				where: {
					mac: mac,
				},
				raw: true,
			});
			ctx.response.body = `Wristband ${mac} deleted successfully`;
		} catch (error) {
			ctx.response.body = error;
		}
	},
};

module.exports = api;
