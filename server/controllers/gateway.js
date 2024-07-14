const { Gateway } = require('../models/models');

const api = {
	// Add a single new gateway.
	createGateway: async (ctx) => {
		const data = ctx.request.body;
		try {
			const params = {
				gateway: data.gateway.toLowerCase(),
			};
			let result = await Gateway.create(params, { raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Get gateway list.
	readGateways: async (ctx) => {
		try {
			let result = await Gateway.findAll({ raw: true });
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Get a single gateway.
	readGateway: async (ctx) => {
		const gateway = ctx.params.gateway;
		try {
			let result = await Gateway.findOne({
				where: { gateway: gateway },
				raw: true,
			});
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Update the location of a single gateway.
	updateGateway: async (ctx) => {
		const data = ctx.request.body;
		try {
			await Gateway.update(
				{
					location: data.location,
				},
				{
					where: {
						gateway: data.gateway,
					},
				}
			);
			ctx.response.body =
				"Gateway's location has been successfully updated";
		} catch (error) {
			ctx.response.body = error;
		}
	},

	// Delete a single gateway.
	deleteGateway: async (ctx) => {
		const gateway = ctx.params.gateway;
		try {
			await Gateway.destroy({
				where: {
					gateway: gateway,
				},
			});
			ctx.response.body = `Gateway ${gateway} has been deleted.`;
		} catch (error) {
			ctx.response.body = error;
		}
	},
};

module.exports = api;
