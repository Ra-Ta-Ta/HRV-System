const config = require('../config')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const { Current_data, Personnel, Gateway, Five_minute_hrv } = require('../models')

const api = {
    // 取得單一使用者即時資料
    readCurrentData: async function (ctx) {
        let { user_id } = ctx.params
        try {
            let data = await Current_data.findOne({
                include: [
                    {
                        model: Personnel,
                        required: true,
                        attributes: ['birthday', 'name', 'sex'],
                        where: {
                            user_id: { [Op.col]: 'current_data.user_id' },
                        },
                    },
                    {
                        model: Gateway,
                        as: 'gateways',
                        required: false,
                        attributes: ['location'],
                        where: {
                            gateway: { [Op.col]: 'current_data.gateway' },
                        },
                    },
                ],
                where: { user_id: user_id },
                raw: true,
                nest: true,
            })

            data.birthday = data.personnel.birthday
            data.name = data.personnel.name
            data.sex = data.personnel.sex
            data.location = data.gateways.location
            delete data.personnel
            delete data.gateways
            ctx.response.body = data
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readAllCurrentData: async function (ctx) {
        try {
            let all_data = await Current_data.findAll({
                include: [
                    {
                        model: Personnel,
                        required: true,
                        attributes: ['birthday', 'name', 'sex'],
                        where: {
                            user_id: { [Op.col]: 'current_data.user_id' },
                        },
                    },
                    {
                        model: Gateway,
                        as: 'gateways',
                        required: false,
                        attributes: ['location'],
                        where: {
                            gateway: { [Op.col]: 'current_data.gateway' },
                        },
                    },
                    {
                        model: Five_minute_hrv,
                        required: false,
                        attributes: ['hrr', 'rmssd', 'sdnn', 'ratio'],
                        where: {
                            user_id: { [Op.col]: 'current_data.user_id' },
                            timestamp: { [Op.between]: [Date.now() - 60000, Date.now()] },
                        },
                    },
                ],
                raw: true,
                nest: true,
            })
            let result = []
            if (all_data.length > 0) {
                all_data.forEach((data) => {
                    data.birthday = data.personnel.birthday
                    data.name = data.personnel.name
                    data.location = data.gateways.location
                    data.hrr = data['5minute_hrv'].hrr
                    data.rmssd = data['5minute_hrv'].rmssd
                    data.sdnn = data['5minute_hrv'].sdnn
                    data.ratio = data['5minute_hrv'].ratio
                    delete data.personnel
                    delete data.gateways
                    delete data['5minute_hrv']
                    const {
                        user_id,
                        name,
                        timestamp,
                        hr,
                        rssi,
                        mac,
                        battery,
                        birthday,
                        location,
                        temperature,
                        hrr,
                        rmssd,
                        sdnn,
                        ratio,
                    } = data
                    result.push({
                        user_id: user_id,
                        name: name,
                        timestamp: timestamp,
                        hr: hr,
                        rssi: rssi,
                        mac: mac,
                        battery: battery,
                        birthday: birthday,
                        location: location,
                        temperature: temperature,
                        hrr: hrr,
                        rmssd: rmssd,
                        sdnn: sdnn,
                        ratio: ratio,
                    })
                })
            }
            ctx.response.body = result.length > 0 ? result : null
        } catch (error) {
            console.log(error)
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
