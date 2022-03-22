const cron = require('node-cron')
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

                let all_hr = []
                let all_rri = []

                for (let hr_group of all_hr_group) {
                    hr_group = hr_group.map((data) => data.hr)
                    const rri_group = hr_group.map((hr) => 60000 / hr)
                    all_hr = all_hr.concat(hr_group)
                    all_rri = all_rri.concat(rri_group)
                }

                const all_hrr = []
                const all_rmssd = []
                const all_sdnn = []

                for (let hr_group of all_hr_group) {
                    const interval = 5000
                    const start_timestamp = hr_group[0]['timestamp']
                    let end_timestamp = start_timestamp + interval
                    let all_one_second_group = []

                    for (let hr_data of hr_group) {
                        const { hr, timestamp } = hr_data
                        const last_group = all_one_second_group[all_one_second_group.length - 1]

                        if (last_group) {
                            if (timestamp > end_timestamp) {
                                end_timestamp = timestamp + interval
                                all_one_second_group.push([hr])
                            } else {
                                last_group.push(hr)
                            }
                        } else {
                            all_one_second_group.push([hr])
                        }
                    }

                    const all_one_second_hr = all_one_second_group.map((one_second_group) => {
                        const all_hr = [...new Set(one_second_group)]
                        const all_hr_length = all_hr.length
                        if (all_hr_length === 1) {
                            return all_hr[0]
                        } else {
                            return Math.round(all_hr.reduce((a, b) => a + b) / all_hr_length)
                        }
                    })

                    const data_is_computable = [...new Set(all_one_second_hr)].length > 1

                    if (data_is_computable) {
                        const all_rri = all_one_second_hr.map((hr) => 60000 / hr)
                        const hrr = HRR(
                            AGE(user_data[0].birthday),
                            MEAN_HR(all_one_second_hr),
                            MAX_HR(all_one_second_hr)
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
                    const hrr =
                        all_hrr.length > 1
                            ? Math.round((all_hrr.reduce((a, b) => a + b) / all_hrr.length) * 100) / 100
                            : Math.round(all_hrr[0] * 100) / 100
                    const rmssd =
                        all_rmssd.length > 1
                            ? Math.round((all_rmssd.reduce((a, b) => a + b) / all_rmssd.length) * 100) / 100
                            : Math.round(all_rmssd[0] * 100) / 100
                    const sdnn =
                        all_sdnn.length > 1
                            ? Math.round((all_sdnn.reduce((a, b) => a + b) / all_sdnn.length) * 100) / 100
                            : Math.round(all_sdnn[0] * 100) / 100
                    const frequency = FFT(all_rri)

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

// 從限定區間中，取得先前已換算的資料總和的平均做為新區間的值，避免操作原始資料而加重資料庫負擔。
let upload_data = async (
    start_time,
    end_time,
    source_hr_table,
    source_hrv_table,
    upload_hr_table,
    upload_hrv_table
) => {
    try {
        let all_hr_data = await source_hr_table.findAll({
            where: { timestamp: { [Op.gte]: start_time, [Op.lt]: end_time } },
        })

        if (all_hr_data.length > 0) {
            let all_user_id = [...new Set(all_hr_data.map((data) => data.user_id))]
            let all_user_id_length = all_user_id.length
            let all_user_id_index = 0

            do {
                let user_id = all_user_id[all_user_id_index]
                let user_hr_data = all_hr_data.filter(
                    (data) => data.user_id === user_id && data.max_hr > 0 && data.mean_hr > 0 && data.min_hr > 0
                )
                let user_hr_data_length = user_hr_data.length

                if (user_hr_data_length > 0) {
                    let user_hr_data_index = 0
                    let all_max_hr = 0
                    let all_mean_hr = 0
                    let all_min_hr = 0

                    do {
                        let data = user_hr_data[user_hr_data_index]
                        all_max_hr += data.max_hr
                        all_mean_hr += data.mean_hr
                        all_min_hr += data.min_hr
                        user_hr_data_index++
                    } while (user_hr_data_index < user_hr_data_length)

                    let total = user_hr_data.length
                    let max_hr = Math.round(all_max_hr / total)
                    let mean_hr = Math.round((all_mean_hr / total) * 10) / 10
                    let min_hr = Math.round(all_min_hr / total)
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

                all_user_id_index++
            } while (all_user_id_index < all_user_id_length)
        }

        let all_hrv_data = await source_hrv_table.findAll({
            where: { timestamp: { [Op.gte]: start_time, [Op.lt]: end_time } },
        })

        if (all_hrv_data.length > 0) {
            let all_user_id = [...new Set(all_hrv_data.map((data) => data.user_id))]
            let all_user_id_length = all_user_id.length
            let all_user_id_index = 0

            do {
                let user_id = all_user_id[all_user_id_index]
                let user_hrv_data = all_hrv_data.filter(
                    (data) =>
                        data.user_id === user_id &&
                        data.hrr > 0 &&
                        data.rmssd > 0 &&
                        data.sdnn > 0 &&
                        data.frequency > 0
                )
                let user_hrv_data_length = user_hrv_data.length

                if (user_hrv_data_length > 0) {
                    let user_hrv_data_index = 0
                    let all_hrr = []
                    let all_rmssd = []
                    let all_sdnn = []
                    let all_frequency = []

                    do {
                        let data = user_hrv_data[user_hrv_data_index]
                        all_hrr.push(data.hrr)
                        all_rmssd.push(data.rmssd)
                        all_sdnn.push(data.sdnn)
                        all_frequency.push(data.frequency)
                        user_hrv_data_index++
                    } while (user_hrv_data_index < user_hrv_data_length)

                    const hrr =
                        all_hrr.length > 1
                            ? Math.round((all_hrr.reduce((a, b) => a + b) / all_hrr.length) * 100) / 100
                            : all_hrr[0] > 0
                            ? Math.round(all_hrr[0] * 100) / 100
                            : 0
                    const rmssd =
                        all_rmssd.length > 1
                            ? Math.round((all_rmssd.reduce((a, b) => a + b) / all_rmssd.length) * 100) / 100
                            : all_rmssd[0] > 0
                            ? Math.round(all_rmssd[0] * 100) / 100
                            : 0
                    const sdnn =
                        all_sdnn.length > 1
                            ? Math.round((all_sdnn.reduce((a, b) => a + b) / all_sdnn.length) * 100) / 100
                            : all_sdnn[0] > 0
                            ? Math.round(all_sdnn[0] * 100) / 100
                            : 0
                    const frequency =
                        all_frequency.length > 1
                            ? Math.round((all_frequency.reduce((a, b) => a + b) / all_frequency.length) * 100) / 100
                            : all_frequency[0] > 0
                            ? Math.round(all_frequency[0] * 100) / 100
                            : 0

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

                all_user_id_index++
            } while (all_user_id_index < all_user_id_length)
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

    // 每小時執行
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

    // 每天執行
    cron.schedule('0 0 * * *', () => {
        let yesterday = {
            start_time: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0),
            end_time: new Date().setHours(0, 0, 0, 0),
        }
        upload_data(yesterday.start_time, yesterday.end_time, One_hour_hr, One_hour_hrv, One_day_hr, One_day_hrv)
    })

    // 每周一執行
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

    // 每月一號執行
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
}
