const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Models = require('../models/models')
const { Personnel, Gateway, Wristband } = Models

const methods = {
    CREATE_DATA: (table, data) => {
        try {
            let result = table.create(data, {
                ignoreDuplicates: true,
            })
            return result
        } catch (error) {
            console.log(error)
        }
    },
    GET_DATA: (table, user_id, start_time, end_time) => {
        try {
            let result = table.findAll({
                where: { user_id: user_id, timestamp: { [Op.between]: [start_time, end_time] } },
            })
            return result
        } catch (error) {
            console.log(error)
        }
    },
    GET_PERSONNELS_DATA: () => {
        try {
            let result = Personnel.findAll()
            return result
        } catch (error) {
            console.log(error)
        }
    },
    UPDATE_DATA: (table, data) => {
        let { user_id } = data
        try {
            let result = table.update(data, { where: { user_id: user_id } })
            return result
        } catch (error) {
            console.log(error)
        }
    },
    UPDATE_GATEWAY: (data) => {
        const { gateway, timestamp } = data
        try {
            Gateway.update(
                { piStatus: timestamp },
                {
                    where: {
                        gateway: gateway,
                    },
                }
            )
        } catch (err) {
            console.log(err)
        }
    },
    UPDATE_WRISTBAND: (data) => {
        const { mac, pair_type } = data
        try {
            Wristband.update(
                { pair_type: pair_type },
                {
                    where: {
                        mac: mac,
                    },
                }
            )
        } catch (err) {
            console.log(err)
        }
    },
}

module.exports = methods
