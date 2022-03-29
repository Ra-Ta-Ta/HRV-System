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
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const koaJwt = require('koa-jwt')
const jsonToken = require('jsonwebtoken')
const router = require('./api_routing')
// const serve = require('koa-static')
const SECRET = 'gini'
const app = new koa()

app.use(cors())
// middleware
app.use((ctx, next) => {
    return next().catch((err) => {
        console.log('err.status', err.status)
        if (err.status == 401) {
            ctx.status = 401
            ctx.body = {
                status: 'fail',
                code: 401,
                message: 'Login has expired or has not logged in yet',
            }
        } else {
            throw err
        }
    })
})
app.use(bodyParser())
app.use(
    koaJwt({ secret: SECRET }).unless({
        path: [/^\/api\/login/],
    })
)
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
