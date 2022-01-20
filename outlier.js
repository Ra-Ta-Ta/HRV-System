const get_outlier = (mean, sd, sd_scale) => {
    const Q1 = mean - sd * 0.675
    const Q3 = mean + sd * 0.675
    const IQR = Q3 - Q1
    const scale = (sd_scale - 0.675) / 1.35
    const outlier = Math.round((Q1 - scale * IQR) * 10) / 10
    return outlier
}

console.log(get_outlier(44, 17.7, 1.5))
console.log(get_outlier(44, 17.7, 2))
// console.log(get_outlier(35.9, 22.1, 1))
// console.log(get_outlier(35.9, 22.1, 1.5))
