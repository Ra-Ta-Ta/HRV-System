const config = require('./config')
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
const { Current_data, Personnel, Gateway, Five_minute_hrv } = require('./models')
const start_time = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0)
const end_time = new Date().setHours(0, 0, 0, 0)
const interval = 60000
const interval_total = (end_time - start_time) / interval
const user_id = 'E121374788'

;(async () => {
    let result = []
    let all_hr_data = (
        await kuotung_sequelize.query(
            `
        SELECT hr as HR, time as timestamp
        FROM datacurrents_history d
        WHERE pid = '${user_id}' AND hr > 0 AND time BETWEEN ${start_time} AND ${end_time}
        ORDER BY time ASC;
    `,
            { raw: true, type: QueryTypes.SELECT }
        )
    ).map((data) => ({
        ...data,
        timestamp: parseInt(data.timestamp, 10),
    }))
    let all_hrv_data = await sequelize
        .query(
            `
        SELECT rmssd as RMSSD, sdnn as SDNN, hrr as HRR, ratio as LF/HF, timestamp
        FROM "5minute_hrv" 
        WHERE user_id = '${user_id}' AND timestamp BETWEEN ${start_time} AND ${end_time}
        ORDER BY timestamp ASC;
    `,
            { raw: true, type: QueryTypes.SELECT }
        )
        .map((data) => ({
            ...data,
            timestamp: parseInt(data.timestamp, 10),
        }))

    for (let i = 0; i < interval_total; i++) {
        let all_hr = all_hr_data
            .filter(
                (data) => data.timestamp >= start_time + interval * i && data.timestamp <= end_time + interval * (i + 1)
            )
            .map((data) => data.hr)
        let hr = all_hr.reduce((a, b) => a + b) / all_hr.length
        let [hrv] = all_hrv_data.filter(
            (data) => data.timestamp >= start_time + interval * i && data.timestamp <= end_time + interval * (i + 1)
        )
        hrv = hrv ? hrv : {}
        let data = Object.assign({ time: start_time }, { hr: hr }, hrv)
        result.push(data)
    }
    console.log(result)
})()
