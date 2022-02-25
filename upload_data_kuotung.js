const cron = require('node-cron')
const config = require('./config')
const Sequelize = require('sequelize')
const { QueryTypes, Op } = Sequelize
const kuotung_sequelize = new Sequelize(config.kuotungPostgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const {
    Data,
    Current_data,
    Personnel,
    Five_minute_hrv,
    One_hour_hrv,
    One_day_hrv,
    One_week_hrv,
    One_month_hrv,
    Five_minute_hr,
    One_hour_hr,
    One_day_hr,
    One_week_hr,
    One_month_hr,
} = require('./models')

// 引入資料表操作function
const { GET_DATA, CREATE_DATA } = require('./methods')

// 引入心率相關算式
const { AGE, MEAN_HR, MAX_HR, MIN_HR, SDNN, RMSSD, HRR, FFT } = require('./formulas')

// 每分鐘從原始數據中，提取並換算 Hr、Hrv 相關數據
let upload_five_minute_data = async () => {
    const last_five_min = {
        start_time: new Date().setMinutes(new Date().getMinutes() - 5, 0, 0),
        end_time: new Date().setSeconds(0, 0),
    }

    try {
        const all_data = (
            await kuotung_sequelize.query(
                `
                    SELECT c.pid as user_id, c.time as timestamp, c.mac::character varying, c.name, c.gateway, c.rssi, c.hr, b.model as pair_type, c.temperature, p.birthdate as birthday, l.name as location
                    FROM datacurrents_history c
                    INNER JOIN persons p ON p.pid = c.pid
                    INNER JOIN bands b ON b.mac = c.mac
                    LEFT JOIN gateways g ON g.name = c.gateway
                    LEFT JOIN locations l ON l.id = g.locationid
                    WHERE c.hr>0 AND c.time BETWEEN ${last_five_min.start_time} AND ${last_five_min.end_time};
                `,
                { raw: true, type: QueryTypes.SELECT }
            )
        ).map((data) => ({
            ...data,
            timestamp: parseInt(data.timestamp, 10),
            birthday: 360950400000,
        }))

        if (all_data.length > 1) {
            const minimum_volume = 1
            const all_user_id = [...new Set(all_data.map((data) => data.user_id))]
            const all_valid_user_id = all_user_id.filter(
                (user_id) => all_data.filter((data) => data.user_id === user_id).length > minimum_volume
            )

            for (let valid_user_id of all_valid_user_id) {
                const all_hr_group = []
                const user_data = all_data.filter((data) => data.user_id === valid_user_id)

                user_data.forEach((data, i) => {
                    const { user_id, hr, timestamp } = data
                    const hr_data = { hr: hr, timestamp: timestamp }
                    const last_group = all_hr_group[all_hr_group.length - 1]
                    const maximum_interval = 5000
                    if (last_group && timestamp - user_data[i - 1]['timestamp'] <= maximum_interval) {
                        last_group.push(hr_data)
                    } else {
                        all_hr_group.push([hr_data])
                    }
                })

                const all_one_minute_group = []
                const interval = 60000
                const start_timestamp = all_hr_group[0][0]['timestamp']
                let end_timestamp = start_timestamp + interval

                for (let hr_group of all_hr_group) {
                    for (let hr_data of hr_group) {
                        const { hr, timestamp } = hr_data
                        const last_group = all_one_minute_group[all_one_minute_group.length - 1]

                        if (last_group) {
                            if (timestamp > end_timestamp) {
                                end_timestamp = timestamp + interval
                                all_one_minute_group.push([hr_data])
                            } else {
                                last_group.push(hr_data)
                            }
                        } else {
                            all_one_minute_group.push([hr_data])
                        }
                    }
                }

                let all_hr = []
                const all_hrr = []
                const all_rmssd = []
                const all_sdnn = []
                const all_frequency = []

                for (let one_minute_group of all_one_minute_group) {
                    const all_five_minute_group = []
                    const interval = 5000
                    const start_timestamp = one_minute_group[0]['timestamp']
                    let end_timestamp = start_timestamp + interval

                    for (let hr_data of one_minute_group) {
                        const { hr, timestamp } = hr_data
                        const last_group = all_five_minute_group[all_five_minute_group.length - 1]

                        if (last_group) {
                            if (timestamp > end_timestamp) {
                                end_timestamp = timestamp + interval
                                all_five_minute_group.push([hr])
                            } else {
                                last_group.push(hr)
                            }
                        } else {
                            all_five_minute_group.push([hr])
                        }
                    }

                    one_minute_group = all_five_minute_group.map((five_minute_group) =>
                        Math.round(five_minute_group.reduce((a, b) => a + b) / five_minute_group.length)
                    )

                    const wristband_malfunction = [...new Set(one_minute_group)].length === 1

                    if (wristband_malfunction) {
                        break
                    } else {
                        all_hr = all_hr.concat(one_minute_group)
                        const all_rri = one_minute_group.map((hr) => 60000 / hr)
                        const hrr = HRR(AGE(user_data[0].birthday), MEAN_HR(one_minute_group), MAX_HR(one_minute_group))
                        const rmssd = RMSSD(all_rri)
                        const sdnn = SDNN(all_rri)
                        const frequency = FFT(all_rri)

                        if (hrr > 0) all_hrr.push(hrr)
                        if (rmssd > 0) all_rmssd.push(rmssd)
                        if (sdnn > 0) all_sdnn.push(sdnn)
                        if (frequency > 0) all_frequency.push(frequency)
                    }
                }

                if (all_hr.length > 1) {
                    const mean_hrr =
                        all_hrr.length > 1
                            ? Math.round((all_hrr.reduce((a, b) => a + b) / all_hrr.length) * 10) / 10
                            : all_hrr[0]
                            ? all_hrr[0]
                            : 0
                    const mean_rmssd =
                        all_rmssd.length > 1
                            ? Math.round((all_rmssd.reduce((a, b) => a + b) / all_rmssd.length) * 10) / 10
                            : all_rmssd[0]
                            ? all_rmssd[0]
                            : 0
                    const mean_sdnn =
                        all_sdnn.length > 1
                            ? Math.round((all_sdnn.reduce((a, b) => a + b) / all_sdnn.length) * 10) / 10
                            : all_sdnn[0]
                            ? all_sdnn[0]
                            : 0
                    const mean_frequency =
                        all_frequency.length > 1
                            ? Math.round((all_frequency.reduce((a, b) => a + b) / all_frequency.length) * 100) / 100
                            : all_frequency[0]
                            ? all_frequency[0]
                            : 0
                    const hr_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        max_hr: MAX_HR(all_hr),
                        mean_hr: MEAN_HR(all_hr),
                        min_hr: MIN_HR(all_hr),
                    }
                    const hrv_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        hrr: mean_hrr,
                        rmssd: mean_rmssd,
                        sdnn: mean_sdnn,
                        frequency: mean_frequency,
                    }

                    await CREATE_DATA(Five_minute_hr, hr_data)
                    await CREATE_DATA(Five_minute_hrv, hrv_data)
                }
            }
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = () => {
    // 每分執行
    cron.schedule('* * * * *', async () => {
        await upload_five_minute_data()
    })
}
