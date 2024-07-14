const cron = require('node-cron')
const config = require('../../config')
const Sequelize = require('sequelize')
const { Op, QueryTypes } = Sequelize
const sequelize = new Sequelize(config.postgreServerUrl, {
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
} = require('../models/models')

// Import data table operation functions
const { GET_DATA, CREATE_DATA } = require('./methods')

// Import heart rate related formulas
const { AGE, MEAN_HR, MAX_HR, MIN_HR, SDNN, RMSSD, HRR, FFT } = require('./formulas')

// Extract and compute Hr and Hrv data from raw data every minute
let upload_five_minute_data = async () => {
    const last_five_min = {
        start_time: new Date().setMinutes(new Date().getMinutes() - 5, 0, 0),
        end_time: new Date().setSeconds(0, 0),
    }

    try {
        const all_data = (
            await sequelize.query(
                `
                SELECT *, p.birthday
                FROM data d
                INNER JOIN personnel p ON p.user_id = d.user_id
                WHERE d.hr > 0 AND d.timestamp BETWEEN ${last_five_min.start_time} AND ${last_five_min.end_time};
            `,
                { raw: true, type: QueryTypes.SELECT }
            )
        ).map((data) => ({
            ...data,
            birthday: parseInt(data.birthday, 10),
            timestamp: parseInt(data.timestamp, 10),
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

                const all_hrr = []
                const all_rmssd = []
                const all_sdnn = []
                const all_frequency = []
                let all_hr = []

                for (let hr_group of all_hr_group) {
                    const interval = 5000
                    const start_timestamp = hr_group[0]['timestamp']
                    let end_timestamp = start_timestamp + interval
                    let all_five_second_hr = []
                    let all_rri = []

                    for (let hr_data of hr_group) {
                        const { hr, timestamp } = hr_data
                        const last_group = all_five_second_hr[all_five_second_hr.length - 1]

                        if (last_group) {
                            if (timestamp > end_timestamp) {
                                end_timestamp = timestamp + interval
                                all_five_second_hr.push([hr])
                            } else {
                                last_group.push(hr)
                            }
                        } else {
                            all_five_second_hr.push([hr])
                        }

                        all_hr.push(hr)
                        all_rri.push(60000 / hr)
                    }

                    const frequency = FFT(all_rri)
                    all_frequency.push(frequency)

                    all_five_second_hr = all_five_second_hr.map((five_second_hr) =>
                        Math.round(five_second_hr.reduce((a, b) => a + b) / five_second_hr.length)
                    )
                    const data_is_computable = [...new Set(all_five_second_hr)].length > 1

                    if (data_is_computable) {
                        const all_rri = all_five_second_hr.map((hr) => 60000 / hr)
                        const hrr = HRR(
                            AGE(user_data[0].birthday),
                            MEAN_HR(all_five_second_hr),
                            MAX_HR(all_five_second_hr)
                        )
                        const rmssd = RMSSD(all_rri)
                        const sdnn = SDNN(all_rri)

                        all_hrr.push(hrr)
                        all_rmssd.push(rmssd)
                        all_sdnn.push(sdnn)
                    }
                }

                let hr_data, hrv_data

                if (all_hr.length > 1) {
                    const calculator = (data) =>
                        data.length > 1
                            ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100
                            : Math.round(data[0] * 100) / 100
                    const hrr = calculator(all_hrr)
                    const rmssd = calculator(all_rmssd)
                    const sdnn = calculator(all_sdnn)
                    const frequency = calculator(all_frequency)

                    hr_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        max_hr: MAX_HR(all_hr),
                        mean_hr: MEAN_HR(all_hr),
                        min_hr: MIN_HR(all_hr),
                    }
                    hrv_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        hrr: hrr,
                        rmssd: rmssd,
                        sdnn: sdnn,
                        frequency: frequency,
                    }
                } else {
                    hr_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        max_hr: 0,
                        mean_hr: 0,
                        min_hr: 0,
                    }
                    hrv_data = {
                        user_id: valid_user_id,
                        timestamp: Date.now(),
                        hrr: 0,
                        rmssd: 0,
                        sdnn: 0,
                        frequency: 0,
                    }
                }

                await CREATE_DATA(Five_minute_hr, hr_data)
                await CREATE_DATA(Five_minute_hrv, hrv_data)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

// Retrieve previously computed data sum from a specified range and average it for a new range to avoid database overload.
let upload_data = async (
    start_time,
    end_time,
    source_hr_table,
    source_hrv_table,
    upload_hr_table,
    upload_hrv_table
) => {
    try {
        const all_hr_data = await source_hr_table.findAll({
            where: { timestamp: { [Op.gte]: start_time, [Op.lt]: end_time } },
        })

        if (all_hr_data.length > 0) {
            const all_user_id = [...new Set(all_hr_data.map((data) => data.user_id))]

            for (let user_id of all_user_id) {
                const all_data = all_hr_data.filter(
                    (data) => data.user_id === user_id && data.max_hr > 0 && data.mean_hr > 0 && data.min_hr > 0
                )
                const all_data_length = all_data.length

                if (all_data_length > 0) {
                    let all_max_hr = 0
                    let all_mean_hr = 0
                    let all_min_hr = 0

                    for (let data of all_data) {
                        all_max_hr += data.max_hr
                        all_mean_hr += data.mean_hr
                        all_min_hr += data.min_hr
                    }

                    let max_hr = Math.round(all_max_hr / all_data_length)
                    let mean_hr = Math.round((all_mean_hr / all_data_length) * 10) / 10
                    let min_hr = Math.round(all_min_hr / all_data_length)
                    let hr_data = {
                        user_id: user_id,
                        timestamp: Date.now(),
                        max_hr: max_hr,
                        mean_hr: mean_hr,
                        min_hr: min_hr,
                    }

                    await CREATE_DATA(upload_hr_table, hr_data)
                } else {
                    let hr_data = {
                        user_id: user_id,
                        timestamp: Date.now(),
                        max_hr: 0,
                        mean_hr: 0,
                        min_hr: 0,
                    }

                    await CREATE_DATA(upload_hr_table, hr_data)
                }
            }
        }

        const all_hrv_data = await source_hrv_table.findAll({
            where: { timestamp: { [Op.gte]: start_time, [Op.lt]: end_time } },
        })

        if (all_hrv_data.length > 0) {
            const all_user_id = [...new Set(all_hrv_data.map((data) => data.user_id))]

            for (let user_id of all_user_id) {
                const all_data = all_hrv_data.filter(
                    (data) =>
                        data.user_id === user_id &&
                        data.hrr > 0 &&
                        data.rmssd > 0 &&
                        data.sdnn > 0 &&
                        data.frequency > 0
                )

                if (all_data.length > 0) {
                    const all_hrr = []
                    const all_rmssd = []


                    const all_sdnn = []
                    const all_frequency = []

                    for (let data of all_data) {
                        all_hrr.push(data.hrr)
                        all_rmssd.push(data.rmssd)
                        all_sdnn.push(data.sdnn)
                        all_frequency.push(data.frequency)
                    }

                    const calculator = (data) =>
                        data.length > 1
                            ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100
                            : data[0] > 0
                            ? Math.round(data[0] * 100) / 100
                            : 0
                    const hrr = calculator(all_hrr)
                    const rmssd = calculator(all_rmssd)
                    const sdnn = calculator(all_sdnn)
                    const frequency = calculator(all_frequency)
                    const hrv_data = {
                        user_id: user_id,
                        timestamp: Date.now(),
                        hrr: hrr,
                        rmssd: rmssd,
                        sdnn: sdnn,
                        frequency: frequency,
                    }

                    await CREATE_DATA(upload_hrv_table, hrv_data)
                } else {
                    const hrv_data = {
                        user_id: user_id,
                        timestamp: Date.now(),
                        hrr: 0,
                        rmssd: 0,
                        sdnn: 0,
                        frequency: 0,
                    }

                    await CREATE_DATA(upload_hrv_table, hrv_data)
                }
            }
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = (() => {
    // Execute every minute
    cron.schedule('* * * * *', async () => {
        await upload_five_minute_data()
    })

    // Execute every hour
    cron.schedule('0 * * * *', () => {
        let last_hour = {
            start_time: new Date().setHours(new Date().getHours() - 1, 0, 0, 0),
            end_time: new Date().setMinutes(0, 0, 0),
        }
        upload_data(
            last_hour.start_time,
            last_hour.end_time,
            Five_minute_hr,
            Five_minute_hrv,
            One_hour_hr,
            One_hour_hrv
        )
    })

    // Execute daily
    cron.schedule('0 0 * * *', () => {
        let yesterday = {
            start_time: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0),
            end_time: new Date().setHours(0, 0, 0, 0),
        }
        upload_data(yesterday.start_time, yesterday.end_time, One_hour_hr, One_hour_hrv, One_day_hr, One_day_hrv)
    })

    // Execute weekly on Monday
    cron.schedule('0 0 * * 1', () => {
        let last_week = {
            start_time: new Date(
                new Date().setDate(new Date().getDate() - ((new Date().getDay() + 6) % 7) - 7)
            ).setHours(0, 0, 0, 0),
            end_time:
                new Date(new Date().setDate(new Date().getDate() - ((new Date().getDay() + 6) % 7) - 7)).setHours(
                    0,
                    0,
                    0,
                    0
                ) +
                60000 * 60 * 24 * 6,
        }
        upload_data(last_week.start_time, last_week.end_time, One_day_hr, One_day_hrv, One_week_hr, One_week_hrv)
    })

    // Execute monthly on the 1st
    cron.schedule('0 0 1 * *', () => {
        let last_month = {
            start_time: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(1)).setHours(
                0,
                0,
                0,
                0
            ),
            end_time: new Date(new Date().setDate(1)).setHours(0, 0, 0, 0),
        }
        upload_data(last_month.start_time, last_month.end_time, One_week_hr, One_week_hrv, One_month_hr, One_month_hrv)
    })
})()
