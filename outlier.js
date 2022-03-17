const { OUTLIER } = require('./formulas')
// rmssd 1.3 - 1.5
console.log('rmssd:', OUTLIER(35.88, 22.14, 1.25))
console.log('rmssd:', OUTLIER(35.88, 22.14, 1.5))
// 1.00 13.74
// 1.10 11.53
// 1.20 9.31
// 1.25 8.2
// 1.50 2.67

// sdnn 1.8 - 2.3
console.log('sdnn:', OUTLIER(44.01, 17.67, 1.75))
console.log('sdnn:', OUTLIER(44.01, 17.67, 2.25))
// 1.25 21.92
// 1.50 17.5
// 1.66 14.7
// 1.75 13.09
// 2.00 8.67
// 2.25 4.25
// 2.33  2.8

// LF/HF 1.3 1 1 1.3
console.log('LF/HF:', OUTLIER(1.63, 1.16, -1.25))
console.log('LF/HF:', OUTLIER(1.63, 1.16, -1))
console.log('LF/HF:', OUTLIER(1.63, 1.16, 1))
console.log('LF/HF:', OUTLIER(1.63, 1.16, 1.25))
