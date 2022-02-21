const noble = require('@abandonware/noble')
// const Ant = require('ant-plus')
// const stick = new Ant.GarminStick3()
// const sensor = new Ant.HeartRateScanner(stick)
const config = require('./config')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    retry: { match: [/ETIMEDOUT/], max: 5 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})
const { Data, Current_data, Personnel, Wristband, Gateway } = require('./models')
const {
    GET_DATA,
    GET_PERSONNELS_DATA,
    UPDATE_DATA,
    CREATE_DATA,
    UPDATE_GATEWAY,
    UPDATE_WRISTBAND,
} = require('./methods')
// 自動排程執行套件
const cron = require('node-cron')

module.exports = async () => {
    await noble.on('stateChange', (state) => {
        console.log(state)
        if (state === 'poweredOn') {
            noble.startScanning([], true)
        } else {
            noble.stopScanning()
        }
    })

    await noble.on('discover', async (band_data) => {
        if (config.model.includes(band_data.advertisement.localName)) {
            const parsed_data = await parse_band_data(band_data)
            if (parsed_data && parsed_data.hr > 0) {
                await CREATE_DATA(Data, parsed_data)
                await UPDATE_DATA(Current_data, parsed_data)
                await UPDATE_GATEWAY(parsed_data)
                await UPDATE_WRISTBAND(parsed_data)
            }
        }
    })

    async function parse_band_data(band_data) {
        /*
    因應型號 I10 自帶兩組 manufacturerData，需加入額外判斷以過濾短的那組，故請調整 noble 套件:
    1. 開啟 node_module => @abandonware => noble => lib => hci-socket => gap.js
    2. 至 227 行附近更改 advertisement.manufacturerData = bytes =>
        if(advertisement.localName == 'I10'  ){
          if(bytes.toString('hex').length === 40){
            advertisement.manufacturerData = bytes;
          }
        }else{
          advertisement.manufacturerData = bytes; 
        }
    */
        let raw_data = band_data.advertisement.manufacturerData.toString('hex')
        let mac = band_data.address
        let pair_type = band_data.advertisement.localName
        let hr = parseInt(raw_data.substring(16, 18), 16)
        let battery = parseInt(raw_data.substring(22, 24), 16)
        let rssi = band_data.rssi
        let gateway = config.gateway
        let step = parseInt(raw_data.substring(18, 22), 16)
        let timestamp = new Date().getTime()
        let temperature = false
        let charge = battery < 10 ? true : false
        let sos = parseInt(raw_data.substring(34, 36), 16) !== 0 ? true : false
        let rri = hr > 0 ? Math.round(60000 / hr) : 0 // 概略版 RRI 公式: 60000 / hr (單位:ms)

        if (pair_type === 'SH09HT' || pair_type === 'S9') {
            let tmp = raw_data.substring(28, 32)
            temperature =
                tmp === '4c6f' ? 'Lo' : tmp === '4869' ? 'Hi' : (parseInt(tmp.substring(1, 4), 16) / 100).toString()
            if (raw_data.length > 36) {
                sos = parseInt(raw_data.substring(36, 38), 16) !== 0 ? true : false
            }
        }

        if (pair_type === 'S2') {
            hr = parseInt(raw_data.substring(36, 38), 16)
            battery = parseInt(raw_data.substring(40, 42), 16)
            step = parseInt(raw_data.substring(30, 32) + raw_data.substring(28, 30), 16)
            temperature = parseInt(raw_data.substring(34, 36) + raw_data.substring(32, 34), 16) / 100
            sos = parseInt(raw_data.substring(40, 42), 16) !== 0 ? true : false
        }

        // 取得已註冊 user_id

        let personnelData = await Personnel.findOne({ where: { mac: mac }, raw: true })

        if (personnelData) {
            let user_id = personnelData.user_id
            let result = {
                user_id: user_id,
                mac: mac,
                pair_type: pair_type,
                hr: hr,
                battery: battery,
                rssi: rssi,
                gateway: config.gateway,
                step: step,
                rri: rri,
                charge: charge,
                sos: sos,
                timestamp: timestamp,
                temperature: temperature,
            }
            return result
        }
    }

    // garmin stick 嘗試開啟接收器
    // await stick.openAsync((err) => {
    //     try {
    //         // 如果偵測到接收器開啟，則開始掃描可接收裝置。
    //         stick.on('startup', () => {
    //             sensor.scan()
    //         })
    //         // 如果偵測到裝置回傳資料，而且同時帶有 SerialNumber 和心率值則上傳。
    //         sensor.on('hbData', async (data) => {
    //             if (data.SerialNumber && data.ComputedHeartRate > 0) {
    //                 let mac = data.SerialNumber.toString()
    //                 let personnelData = await Personnel.findOne({ where: { mac: mac }, raw: true })
    //                 if (personnelData) {
    //                     let result = {
    //                         user_id: personnelData.user_id,
    //                         mac: mac,
    //                         pair_type: 'Garmin',
    //                         hr: data.ComputedHeartRate,
    //                         battery: null,
    //                         rssi: null,
    //                         gateway: config.gateway,
    //                         step: null,
    //                         rri: Math.round(60000 / data.ComputedHeartRate),
    //                         charge: null,
    //                         sos: null,
    //                         timestamp: Date.now(),
    //                         temperature: null,
    //                     }
    //                     CREATE_DATA(Data, result)
    //                     UPDATE_DATA(Current_data, result)
    //                     UPDATE_GATEWAY(result)
    //                     UPDATE_WRISTBAND(result)
    //                 }
    //             }
    //         })
    //     } catch (err) {
    //         console.log(err)
    //     }
    // })
}
