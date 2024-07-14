const { Op } = require('sequelize')
const { Data } = require('../models/models')

const api = {
    // Get interval data for a single user.
    readData: async (ctx) => {
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
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
