// 資料庫相關套件
const { sequelize } = require('./models')
sequelize.sync()
// 引用 band_app 上傳手環相關資料
const Band = require('./band_app')()

// 引用 hrv、hr table 上傳程式
const Upload_data = require('./upload_data')()
const Upload_data_kuotung = require('./upload_data_kuotung')()

// 引用 open 自動開啟網頁套件
const open = require('open')

// koa 相關套件
const koa = require('koa')
const app = new koa()
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const router = require('./api_routing')
// const serve = require('koa-static')

app.use(cors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
// app.use(serve(__dirname + '/dist'))

const server = app.listen(3000, () => {
    // open('http://localhost:3000', {
    //     app: {
    //         name: open.apps.edge,
    //     },
    // })
})

// process.on('SIGTERM', () => {
//     server.close()
// })
