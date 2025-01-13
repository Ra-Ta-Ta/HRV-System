// Upload wristband-related data (Comment out this line if the host Bluetooth does not support this feature)
// const Band = require('./server/utils/band_app')
// Upload heart rate variability analysis data
const Upload_data = require('./server/utils/upload_data');
// Koa-related packages
const koa = require('koa');
const cors = require('koa2-cors');
const koaStatic = require('koa-static');
const koaRouter = require('./server/routes/routes');
const bodyParser = require('koa-bodyparser');
const https = require('https');
const path = require('path');
const fs = require('fs');
const enforceHttps = require('koa-sslify').default;
const { gateway, port } = require('./config');
const koaJwt = require('koa-jwt');
const {
	parseToken,
	getTokenRenewStatus,
	createNewToken,
} = require('./server/utils/token');
const app = new koa();
const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/hrv.ginibio.com/privkey.pem'),
	cert: fs.readFileSync(
		'/etc/letsencrypt/live/hrv.ginibio.com/fullchain.pem'
	),
};
const server = https.createServer(options, app.callback());

// app.use(enforceHttps())
app.use(cors());
app.use(bodyParser());
app.use((ctx, next) => {
	return next().catch((err) => {
		if (err.status == 401) {
			ctx.status = 401;
			ctx.body = {
				status: 'fail',
				code: 401,
				message: 'Login has expired or has not logged in yet',
			};
		} else {
			throw err;
		}
	});
});
app.use(
	koaJwt({ secret: gateway }).unless({
		path: [/\//],
	})
);
// app.use(koaStatic ('dashboard'))
app.use(koaRouter.routes(), koaRouter.allowedMethods());

server.listen(port, () => {
	// process.on('SIGTERM', () => {
	//     this.close()
	// })
});
