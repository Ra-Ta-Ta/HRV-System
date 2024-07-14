// Import functions for data table operations
const { GET_DATA, CREATE_DATA } = require('./server/utils/methods');
// Import formulas related to heart rate
const {
	AGE,
	MEAN_HR,
	MAX_HR,
	MIN_HR,
	SDNN,
	RMSSD,
	HRR,
	FFT,
} = require('./server/utils/formulas');
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
} = require('./server/models/models');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { spawn } = require('child_process');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const fs = require('fs');
const open = require('open');
const oauth = OAuth({
	consumer: {
		key: '76fe08d1-0284-4b45-a781-fd837c5cfac0',
		secret: '4qOdWrTFm0GtFB6Dkv9ys2YkDroAfAUWCaq',
	},
	signature_method: 'HMAC-SHA1',
	hash_function(base_string, key) {
		return crypto
			.createHmac('sha1', key)
			.update(base_string)
			.digest('base64');
	},
});
const urlList = {
	requestTokenUrl:
		'https://connectapi.garmin.com/oauth-service/oauth/request_token',
	obtainRequestTokenFromConnectUrl:
		'https://apis.garmin.com/tools/obtainRequestTokenFromConnect',
	sendRestApiRequestUrl: 'https://apis.garmin.com/tools/sendRestApiRequest',
};
const { GarminConnect } = require('garmin-connect');
const garminConnectAccount = {
	username: 'yang.tan@gini.tw',
	password: '!QAZ2wsx',
};
const GCClient = new GarminConnect(garminConnectAccount);

const sessionListPath = './sessionList';
let sessionList = {};

function getSessionList() {
	const rawData = fs.readFileSync(sessionListPath, (error, data) => {
		if (error) console.log(error);
	});
	return rawData.toString() == '' ? {} : JSON.parse(rawData);
}

function setSessionList() {
	fs.writeFile(sessionListPath, JSON.stringify(sessionList), (error) => {
		if (error) console.log(error);
	});
}
function round(data) {
	return Math.round(data * 100) / 100;
}

(async function main() {
	// const { oauth_nonce, oauth_signature, oauth_consumer_key, oauth_timestamp, oauth_signature_method, oauth_version } =
	//     oauth.authorize({
	//         url: urlList.requestTokenUrl,
	//         method: 'POST',
	//     })
	// const headers = {
	//     Authorization: `OAuth oauth_nonce=${oauth_nonce}, oauth_signature="${encodeURIComponent(
	//         oauth_signature
	//     )}", oauth_consumer_key="${oauth_consumer_key}", oauth_timestamp="${oauth_timestamp}", oauth_signature_method="${oauth_signature_method}", oauth_version="${oauth_version}"`,
	// }
	// const response = await fetch(urlList.requestTokenUrl, {
	//     method: 'POST',
	//     headers: headers,
	// }).then(function (response) {
	//     if (response.status !== 200) {
	//         console.log('Looks like there was a problem. Status Code: ', response.status)
	//         return
	//     }
	//     return response.text()
	// })
	// const oauth_token = response.split('&')[0].split('=').pop()
	// const oauth_token_secret = response.split('&')[1].split('=').pop()
	// console.log('oauth_token', oauth_token)
	// console.log('oauth_token_secret', oauth_token_secret)
	// const userAuthorizationUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${oauth_token}&&oauth_callback=https://apis.garmin.com/tools/oauthAuthorizeUser?action=step3`
	// open(userAuthorizationUrl)
	// Create a new Garmin Connect Client
	const now = new Date().setMilliseconds(0);
	const startTime = new Date().setHours(0, 0, 0, 0);
	const endTime = new Date().setHours(23, 59, 59, 0);

	try {
		if (fs.existsSync(sessionListPath)) {
			sessionList = getSessionList();
			await GCClient.restoreOrLogin(
				sessionList[garminConnectAccount['username']],
				garminConnectAccount['username'],
				garminConnectAccount['password']
			);
			sessionList[garminConnectAccount['username']] =
				GCClient['sessionJson'];
			setSessionList();

			const deviceId = 3418444389;
			const valid_user_id = 'C111222333';
			const birthday = 30;
			// const deviceId = 3335248726
			const isMatched = (await GCClient.getDeviceInfo())
				.map((data) => data['deviceId'])
				.includes(deviceId);
			if (isMatched) {
				const heartRateRawData = await GCClient.getHeartRate();

				if (!heartRateRawData['heartRateValues']) {
					console.log('Heart rate value not found');
					return;
				}

				const heartRateValues = heartRateRawData[
					'heartRateValues'
				].filter((heartRateValue) => heartRateValue[1]);

				// if (heartRateValues) {
				//     const tempHeartRateValues = JSON.parse(JSON.stringify(heartRateValues))
				//     for (const heartRateValue of tempHeartRateValues) {
				//         heartRateValue[0] = new Date(heartRateValue[0]).toLocaleString('en', {
				//             timeZone: 'Asia/Taipei',
				//         })
				//     }
				//     console.log(tempHeartRateValues)
				// }

				const interval = 1000 * 60 * 5;
				const fiveMinutesHrList = [];
				const lastTimestamp =
					heartRateValues[heartRateValues.length - 1][0];
				let startTimestamp = heartRateValues[0][0];
				let endTimestamp = startTimestamp + interval;
				let startIndex = 0;
				let index = 0;

				while (index <= heartRateValues.length - 1) {
					const heartRateValue = heartRateValues[index];
					const timestamp = heartRateValue[0];
					const hr = heartRateValue[1];
					if (fiveMinutesHrList.length > 0) {
						const fiveMinutesHr =
							fiveMinutesHrList[fiveMinutesHrList.length - 1];

						if (timestamp <= endTimestamp) {
							fiveMinutesHr.push(heartRateValue);
							index++;
						} else {
							fiveMinutesHrList.push([]);
							startIndex++;
							index = startIndex;
							startTimestamp = heartRateValues[startIndex][0];
							endTimestamp = startTimestamp + interval;
						}
					} else {
						fiveMinutesHrList.push([heartRateValue]);
						index++;
					}
				}

				for (let fiveMinuteHr of fiveMinutesHrList) {
					const currentTimestamp = fiveMinuteHr[0][0];
					fiveMinuteHr = fiveMinuteHr.map((data) => data[1]);
					const deduplicatedData = [...new Set(fiveMinuteHr)];
					const dataIsComputable = deduplicatedData.length > 1;
					let hrData, hrvData;

					if (dataIsComputable) {
						const rriList = fiveMinuteHr.map((hr) => 60000 / hr);
						const hrr = round(
							HRR(
								AGE(birthday),
								MEAN_HR(fiveMinuteHr),
								MAX_HR(fiveMinuteHr)
							)
						);
						const rmssd = round(RMSSD(rriList));
						const sdnn = round(SDNN(rriList));
						const mockFiveMinuteHr = JSON.parse(
							JSON.stringify(deduplicatedData)
						);
						mockFiveMinuteHr.forEach((current_hr, index, array) => {
							const tempHrList = [];
							const nextHr = array[index + 1];

							if (!nextHr) return;

							const difference = Math.abs(current_hr - nextHr);

							if (difference == 0) return;

							for (let i = 1; i < difference; i++) {
								if (current_hr > nextHr) {
									tempHrList.push(current_hr - i);
								} else if (current_hr < nextHr) {
									tempHrList.push(current_hr + i);
								}
							}
							mockFiveMinuteHr.splice(
								index + 1,
								0,
								...tempHrList
							);
						});
						console.log(fiveMinuteHr, mockFiveMinuteHr);
						const mockRRIList = mockFiveMinuteHr.map(
							(hr) => 60000 / hr
						);
						const frequency = round(FFT(mockRRIList));

						hrData = {
							user_id: valid_user_id,
							timestamp: currentTimestamp,
							max_hr: round(MAX_HR(fiveMinuteHr)),
							mean_hr: round(MEAN_HR(fiveMinuteHr)),
							min_hr: round(MIN_HR(fiveMinuteHr)),
						};
						hrvData = {
							user_id: valid_user_id,
							timestamp: currentTimestamp,
							hrr: hrr,
							rmssd: rmssd,
							sdnn: sdnn,
							frequency: frequency,
						};
					} else {
						hrData = {
							user_id: valid_user_id,
							timestamp: currentTimestamp,
							max_hr: deduplicatedData[0],
							mean_hr: deduplicatedData[0],
							min_hr: deduplicatedData[0],
						};
						hrvData = {
							user_id: valid_user_id,
							timestamp: currentTimestamp,
							hrr: 0,
							rmssd: 0,
							sdnn: 0,
							frequency: 0,
						};
					}
					console.log(hrvData);
					await CREATE_DATA(Five_minute_hr, hrData);
					await CREATE_DATA(Five_minute_hrv, hrvData);
				}
			}
		} else {
			fs.writeFile(sessionListPath, '', (error) => {
				if (error) console.log('writeFile', error);
				main();
			});
		}
	} catch (error) {
		console.log(error);
	}

	// console.log(now, startTime, endTime)

	// const url = `https://apis.garmin.com/wellness-api/rest/${summaryType}?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`

	// const userAccessToken = {
	//     key: '88eadc82-1b53-45cf-bbac-dfca3b6ccffb',
	//     secret: 'LLsZuuMKRaBx9G7nBaK0mKWEap32qjabfA8',
	// }

	// const oauth_response = (
	//     await fetch(url, {
	//         method: 'GET',
	//         headers: oauth.toHeader(
	//             oauth.authorize(
	//                 {
	//                     url: url,
	//                     method: 'GET',
	//                 },
	//                 userAccessToken
	//             )
	//         ),
	//     }).then(function (response) {
	//         if (response.status !== 200) {
	//             console.log('Looks like there was a problem. Status Code: ', response.status)
	//             return
	//         }
	//         return response.json()
	//     })
	// ).filter((data) => data.startTimeInSeconds >= startTime && data.startTimeInSeconds <= endTime)
	// // console.log(oauth_response, oauth_response.length)
	// const timeOffsetHeartRateSamples = oauth_response
	//     .map((data) => data['timeOffsetHeartRateSamples'])
	//     .reduce((accumulator, currentValue) => Object.assign(accumulator, currentValue), {})

	// for (const [key, value] of Object.entries(timeOffsetHeartRateSamples)) {
	//     const newKey = new Date((startTime + parseInt(key)) * 1000).toLocaleString('en', {
	//         timeZone: 'Asia/Taipei',
	//     })
	//     timeOffsetHeartRateSamples[newKey] = value
	//     delete timeOffsetHeartRateSamples[key]
	// }

	// console.log(timeOffsetHeartRateSamples)
})();
