const api = {
	readGarminConnect: async (ctx) => {
		if (ctx.request.body) {
			const { body } = ctx.request;
			const endpointList = ['stressDetails', 'dailies', 'epochs', 'hrv'];
			const eightHoursToSecond = 60 * 60 * 8;
			const startTime =
				new Date().setHours(0, 0, 0, 0) / 1000 - eightHoursToSecond;
			const endTime =
				new Date().setHours(23, 59, 59, 0) / 1000 - eightHoursToSecond;

			for (const endpoint of endpointList) {
				if (body.hasOwnProperty(endpoint) && body[endpoint]) {
					const rawData = body[endpoint].filter(
						(data) =>
							data.startTimeInSeconds >= startTime &&
							data.startTimeInSeconds <= endTime
					);

					switch (endpoint) {
						case 'stressDetails':
							[
								'timeOffsetStressLevelValues',
								'timeOffsetBodyBatteryValues',
							].forEach((dataKey) => {
								const data = rawData
									.map((data) => data[dataKey])
									.reduce(
										(accumulator, currentValue) =>
											Object.assign(
												accumulator,
												currentValue
											),
										{}
									);

								for (const [key, value] of Object.entries(
									data
								)) {
									const newKey = new Date(
										(startTime + parseInt(key)) * 1000
									).toLocaleString('en', {
										timeZone: 'Asia/Taipei',
									});
									let newValue = '';

									if (
										dataKey == 'timeOffsetStressLevelValues'
									) {
										if (value >= 76 && value <= 100) {
											newValue = 'High stress';
										} else if (value >= 51 && value <= 75) {
											newValue = 'Medium stress';
										} else if (value >= 26 && value <= 50) {
											newValue = 'Low stress';
										} else if (value <= 25) {
											newValue = 'Resting stress';
										}
									} else if (
										dataKey == 'timeOffsetBodyBatteryValues'
									) {
										if (value >= 76 && value <= 100) {
											newValue =
												'Very high energy reserve';
										} else if (value >= 51 && value <= 75) {
											newValue = 'High energy reserve ';
										} else if (value >= 26 && value <= 50) {
											newValue = 'Medium energy reserve ';
										} else if (value <= 25) {
											newValue = 'Low energy reserve ';
										}
									}

									data[newKey] = newValue;
									delete data[key];
								}

								// if (dataKey == 'timeOffsetStressLevelValues') {
								// 	console.log(
								// 		'timeOffsetStressLevelValues',
								// 		data
								// 	);
								// } else {
								// 	console.log(
								// 		'timeOffsetBodyBatteryValues',
								// 		data
								// 	);
								// }
							});

							break;

						case 'dailies':
							const data = rawData
								.map(
									(data) => data['timeOffsetHeartRateSamples']
								)
								.reduce(
									(accumulator, currentValue) =>
										Object.assign(
											accumulator,
											currentValue
										),
									{}
								);

							for (const [key, value] of Object.entries(data)) {
								const newKey = new Date(
									(startTime + parseInt(key)) * 1000
								).toLocaleString('en', {
									timeZone: 'Asia/Taipei',
								});
								data[newKey] = value;
								delete data[key];
							}

							// console.log('timeOffsetHeartRateSamples', data);

							break;

						case 'epochs':
							console.log(endpoint, rawData);

							break;

						case 'hrv':
							console.log(endpoint, rawData);

							break;
					}
				}
			}
		}
	},
};

module.exports = api;
