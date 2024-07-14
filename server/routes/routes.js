const koaRouter = require('koa-router');
const router = koaRouter();
const fs = require('fs');

const Data = require('../controllers/data');
const Current_data = require('../controllers/current_data');
const Personnel = require('../controllers/personnel');
const User = require('../controllers/user');
const Wristband = require('../controllers/wristband');
const Gateway = require('../controllers/gateway');
const Hrv = require('../controllers/hrv');
const Hr = require('../controllers/hr');
const Garmin = require('../controllers/garmin');
const Exit = require('../controllers/exit');

router
	.get('/', async (ctx) => {
		try {
			let result = 'test';
			ctx.response.body = result;
		} catch (error) {
			ctx.response.body = error;
		}
	})
	.get('/data/:user_id&:start_time&:end_time', Data.readData)

	.get('/hrv/5minute-hrv/:user_id&:start_time&:end_time', Hrv.read5MinuteHrv)
	.get('/hrv/1hour-hrv/:user_id&:start_time&:end_time', Hrv.read1HourHrv)
	.get('/hrv/1day-hrv/:user_id&:start_time&:end_time', Hrv.read1DayHrv)
	.get(
		'/hrv/latest-5minute-hrv/:user_id&:start_time&:end_time',
		Hrv.readLatest5MinuteHrv
	)
	.get(
		'/hrv/latest-1day-hrv/:user_id&:start_time&:end_time',
		Hrv.readLatest1DayHrv
	)
	.get(
		'/hrv/latest-1week-hrv/:user_id&:start_time&:end_time',
		Hrv.readLatest1WeekHrv
	)
	.get(
		'/hrv/latest-1month-hrv/:user_id&:start_time&:end_time',
		Hrv.readLatest1MonthHrv
	)

	.get('/hr/5minute-hr/:user_id&:start_time&:end_time', Hr.read5MinuteHr)
	.get(
		'/hr/latest-1day-hr/:user_id&:start_time&:end_time',
		Hr.readLatest1DayHr
	)
	.get(
		'/hr/latest-1month-hr/:user_id&:start_time&:end_time',
		Hr.readLatest1MonthHr
	)

	.get('/current-data/:user_id', Current_data.readCurrentData)
	.get('/all-current-data', Current_data.readAllCurrentData)

	.post('/personnel', Personnel.createPersonnel)
	.get('/personnels', Personnel.readPersonnels)
	.get('/personnel/:user_id', Personnel.readPersonnel)
	.put('/personnel', Personnel.updatePersonnel)
	.put('/personnel/pair-mac', Personnel.updatePairedMac)
	.del('/personnel/:user_id', Personnel.deletePersonnel)

	.post('/login', User.login)
	.post('/check-status', User.checkStatus)

	.post('/wristband', Wristband.createWristband)
	.get('/wristbands', Wristband.readWristbands)
	.get('/wristband/:mac', Wristband.readWristband)
	.put('/wristband', Wristband.updateWristband)
	.del('/wristband/:mac', Wristband.deleteWristband)

	.post('/gateway', Gateway.createGateway)
	.get('/gateways', Gateway.readGateways)
	.get('/gateway/:gateway', Gateway.readGateway)
	.put('/gateway', Gateway.updateGateway)
	.del('/gateway/:gateway', Gateway.deleteGateway)

	.post('/garmin/read-garmin-connect', Garmin.readGarminConnect)

	.post('/exit', Exit.exit);
// router.prefix('/api')
module.exports = exports = router;
