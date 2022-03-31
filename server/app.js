const { gateway } = require('./config')
const koa = require('koa')
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const koaJwt = require('koa-jwt')
const serve = require('koa-static')
const router = require('./routes/routes')
const open = require('open')
const Band = require('./utils/band_app')()
const Upload_data = require('./utils/upload_data')()
const SECRET = gateway
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
app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve(__dirname + '/dashboard'))

const server = app.listen(3000, () => {
    open('http://localhost:3000', {
        // app: {
        //     name: open.apps.edge,
        // },
    })
})

process.on('SIGTERM', () => {
    server.close()
})
