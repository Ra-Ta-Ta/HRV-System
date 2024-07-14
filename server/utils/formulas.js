const { Time } = require('@avihimsa/heart-rate-variability-analysis')
const formulas = {
    AGE: (user_birthday) => {
        let age = 40
        if (user_birthday) {
            const current = new Date()
            const birthday = new Date(parseInt(user_birthday, 10))
            age = current.getFullYear() - birthday.getFullYear()
            const month_difference = current.getMonth() - birthday.getMonth()
            if (month_difference < 0 || (month_difference === 0 && current.getDate() < birthday.getDate())) {
                age--
            }
        }
        return age
    },
    MEAN_HR: (all_hr) => all_hr.reduce((a, b) => a + b) / all_hr.length,
    MAX_HR: (all_hr) => all_hr.reduce((a, b) => Math.max(a, b)),
    MIN_HR: (all_hr) => all_hr.reduce((a, b) => Math.min(a, b)),
    SDNN: (all_rri) => {
        const sdnn = Time.SDNN(all_rri)
        return sdnn > 0 ? sdnn : 0
    },
    RMSSD: (all_rri) => {
        const rmssd = Time.RMSSD(all_rri)
        return rmssd > 0 ? rmssd : 0
    },
    HRR: (age, current_hr, current_max_hr) => {
        // Max heart rate estimation uses Jackson et al. (2007) formula adjusted for age: HRmax = 206.9 - (0.67 * Age).
        let estimate_max_hr = 206.9 - 0.67 * age
        // Use actual data if higher or lower than estimated data.
        let max_hr = current_max_hr > estimate_max_hr ? current_max_hr : estimate_max_hr
        // According to the American Heart Association statistics: Resting heart rate is about 60 for normal individuals and can be as low as 40 for professional athletes.
        let rest_hr = current_hr < 40 ? current_hr : 40
        // Heart rate reserve (HRR) is the difference between maximum and minimum heart rates.
        let hrr = max_hr - rest_hr
        // %HRR is a quantified indicator of HRR: %HRR = (HRex – HRrest)/(HRmax – HRrest).
        let percent_hrr = ((current_hr - rest_hr) / hrr) * 100
        return percent_hrr > 0 ? percent_hrr : 0
    },
    FFT: (all_rri) => {
        const { fft, util } = require('fft-js')
        const rri_mean = all_rri.reduce((a, b) => a + b) / all_rri.length
        const all_frequency = all_rri.map((rri) => rri - rri_mean)
        const all_frequency_length = all_frequency.length
        const get_size = (power) => Math.pow(2, power)
        let power = 1
        while (get_size(power) < all_frequency_length) {
            power++
        }
        const bufferSize = get_size(power)
        const buffer = all_frequency.concat(new Array(bufferSize - all_frequency_length).fill(0))
        const phasors = fft(buffer)
        const sample_rate = 1000
        const frequencies = util.fftFreq(phasors, sample_rate)
        const magnitudes = util.fftMag(phasors)
        const ms_to_s = (ms) => ms / 1000
        const points = frequencies.map(function (f, ix) {
            return { x: ms_to_s(f), y: magnitudes[ix] / (bufferSize / 2) }
        })
        let HF = []
        let LF = []

        for (let point of points) {
            if (point.x >= 0.15 && point.x <= 0.4) HF.push(point.y)
            else if (point.x >= 0.04 && point.x < 0.15) LF.push(point.y)
        }

        HF = HF.length > 1 ? HF.reduce((a, b) => a + b) : HF[0]
        LF = LF.length > 1 ? LF.reduce((a, b) => a + b) : LF[0]

        const frequency = LF / HF

        return frequency > 0 ? frequency : 0
    },
    OUTLIER: (mean, sd, sd_scale) => {
        const Q1 = mean - sd * 0.675
        const Q3 = mean + sd * 0.675
        const IQR = Q3 - Q1
        const scale = (sd_scale - 0.675) / 1.35
        const outlier = Math.round((Q1 - scale * IQR) * 100) / 100
        return outlier
    },
}

module.exports = formulas
