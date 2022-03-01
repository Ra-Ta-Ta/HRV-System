const { OUTLIER } = require('./formulas')
// rmssd 7.9 - 5.3
console.log('rmssd:', OUTLIER(35.88, 22.14, 1.25))
console.log('rmssd:', OUTLIER(35.88, 22.14, 1.5))
// 1.00 13.74
// 1.10 11.53
// 1.20 9.31
// 1.25 8.2
// 1.50 2.67

// sdnn 10 - 5.4
console.log('sdnn:', OUTLIER(44.01, 17.67, 2))
console.log('sdnn:', OUTLIER(44.01, 17.67, 2.25))
// 1.25 21.92
// 1.50 17.5
// 1.66 14.7
// 1.75 13.09
// 2.00 8.67
// 2.25 4.25
// 2.33  2.8

// LF/HF 2.7 2.1 0.6 0.1
console.log('LF/HF:', OUTLIER(1.63, 1.16, -1.25))
console.log('LF/HF:', OUTLIER(1.63, 1.16, -1))
console.log('LF/HF:', OUTLIER(1.63, 1.16, 1))
console.log('LF/HF:', OUTLIER(1.63, 1.16, 1.25))
