const config = require('../config')
const Sequelize = require('sequelize')
const { Op, QueryTypes } = Sequelize
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const kuotung_sequelize = new Sequelize(config.kuotungPostgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const { Current_data, Personnel, Gateway, Five_minute_hrv } = require('../models')

const api = {
    // 取得單一使用者即時資料
    readCurrentData: async function (ctx) {
        const { user_id } = ctx.params
        try {
            const [data] = await sequelize.query(
                `
                    SELECT c.*, p.name, p.birthday, p.sex, g.location
                    FROM current_data c
                    INNER JOIN personnel p ON p.user_id = c.user_id
                    LEFT JOIN gateway g ON g.gateway = c.gateway
                    WHERE c.user_id = '${user_id}';
                `,
                { raw: true, type: QueryTypes.SELECT }
            )
            /* 測試區 */

            const [kuotung_data] = await kuotung_sequelize.query(
                `
                    SELECT c.pid as user_id, c.time as timestamp, c.mac::character varying, c.name, c.gateway, c.rssi, c.hr, b.model as pair_type, c.temperature, p.birthdate as birthday, l.name as location
                    FROM datacurrents c
                    INNER JOIN persons p ON p.pid = c.pid
                    INNER JOIN bands b ON b.mac = c.mac
                    LEFT JOIN gateways g ON g.name = c.gateway
                    LEFT JOIN locations l ON l.id = g.locationid
                    WHERE c.pid = '${user_id}';
                `,
                { raw: true, type: QueryTypes.SELECT }
            )
            /* 測試區 */
            ctx.response.body = data ? data : kuotung_data
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
    readAllCurrentData: async function (ctx) {
        try {
            let data = (
                await sequelize.query(
                    `
                    SELECT c.*, p.name, p.birthday, g.location, f.hrr, f.rmssd, f.sdnn, f.ratio
                    FROM current_data c
                    INNER JOIN personnel p ON p.user_id = c.user_id
                    LEFT JOIN gateway g ON g.gateway = c.gateway
                    LEFT JOIN (
                        SELECT *
                        FROM "5minute_hrv" 
                        WHERE timestamp BETWEEN ${Date.now() - 60000} AND ${Date.now()}
                    ) f ON f.user_id = c.user_id;
                `,
                    { raw: true, type: QueryTypes.SELECT }
                )
            ).map((data) => ({
                ...data,
                timestamp: parseInt(data.timestamp, 10),
            }))
            /* 測試區 */
            let kuotung_data = (
                await kuotung_sequelize.query(
                    `
                    SELECT c.pid as user_id, c.time as timestamp, c.mac::character varying, c.name, c.gateway, c.rssi, c.bat as battery, c.hr, b.model as pair_type, c.temperature, p.birthdate as birthday, l.name as location
                    FROM datacurrents c
                    INNER JOIN persons p ON p.pid = c.pid
                    INNER JOIN bands b ON b.mac = c.mac
                    LEFT JOIN gateways g ON g.name = c.gateway
                    LEFT JOIN locations l ON l.id = g.locationid;
                `,
                    { raw: true, type: QueryTypes.SELECT }
                )
            ).map((data) => ({
                ...data,
                timestamp: parseInt(data.timestamp, 10),
                birthday: 360950400000,
            }))

            if (kuotung_data.length > 0) {
                const kuotung_user_id = kuotung_data.map((data) => data.user_id)
                const kuotung_hrv = (
                    await Five_minute_hrv.findAll({
                        where: { timestamp: { [Op.between]: [Date.now() - 60000, Date.now()] } },
                        raw: true,
                    })
                ).filter((data) => kuotung_user_id.includes(data.user_id))

                kuotung_data.forEach((data) => {
                    let [hrv] = kuotung_hrv.filter((kuotung_data) => kuotung_data.user_id === data.user_id)
                    if (hrv) {
                        const { hrr, rmssd, sdnn, ratio } = hrv
                        Object.assign(data, { hrr: hrr, rmssd: rmssd, sdnn: sdnn, ratio: ratio })
                    } else {
                        Object.assign(data, { hrr: null, rmssd: null, sdnn: null, ratio: null })
                    }
                })
                data = data.concat(kuotung_data)
            }
            await kuotung_sequelize.query(
                `
                SELECT c.pid as user_id, c.time as timestamp, c.mac::character varying, c.name, c.gateway, c.rssi, c.bat as battery, c.hr, b.model as pair_type, c.temperature, p.birthdate as birthday, l.name as location
                FROM datacurrents c
                INNER JOIN persons p ON p.pid = c.pid
                INNER JOIN bands b ON b.mac = c.mac
                LEFT JOIN gateways g ON g.name = c.gateway
                LEFT JOIN locations l ON l.id = g.locationid;
            `,
                { raw: true, type: QueryTypes.SELECT }
            )

            /* 測試區 */
            ctx.response.body = data
        } catch (error) {
            ctx.response.body = error.errors
        }
    },
}

module.exports = api
