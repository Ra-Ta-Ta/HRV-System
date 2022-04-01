// 上傳手環相關資料 (如主機藍芽不支援此功能，請註解此行)
const Band = require('./utils/band_app')()
// 上傳心率變異分析
const Upload_data = require('./utils/upload_data')()
// koa 相關套件
const koa = require('koa')
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const koaJwt = require('koa-jwt')
const router = require('./routes/routes')
const serve = require('koa-static')
const { parseToken, getTokenRenewStatus, createNewToken } = require('./utils/token')
const SECRET = require('./config').gateway
const open = require('open')
const app = new koa()

app.use(cors())
app.use((ctx, next) => {
    return next().catch((err) => {
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
app.use(router.routes(), router.allowedMethods())
app.use(serve(__dirname + '/server/dashboard'))

const server = app.listen(3000, () => {
    open('http://localhost:3000', {
        //     app: {
        //         name: open.apps.edge,
        //     },
    })
})

process.on('SIGTERM', () => {
    server.close()
})
