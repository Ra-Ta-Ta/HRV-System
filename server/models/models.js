const config = require('../config')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.postgreServerUrl, {
    logging: false,
    pool: { max: 10, min: 0, acquire: 60000, idle: 10000 },
    dialectOptions: {
        connectTimeout: 60000,
    },
})

const pg = require('pg')

const Model = Sequelize.Model

class Data extends Model {}

class Current_data extends Model {}

class Five_minute_hrv extends Model {}
class One_hour_hrv extends Model {}
class One_day_hrv extends Model {}
class One_week_hrv extends Model {}
class One_month_hrv extends Model {}

class Five_minute_hr extends Model {}
class One_hour_hr extends Model {}
class One_day_hr extends Model {}
class One_week_hr extends Model {}
class One_month_hr extends Model {}

class Personnel extends Model {}

class User extends Model {}

class Gateway extends Model {}

class Wristband extends Model {}

Data.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        battery: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        gateway: {
            type: Sequelize.STRING(20),
        },
        hr: {
            type: Sequelize.INTEGER,
        },
        mac: {
            type: Sequelize.STRING(20),
        },
        pair_type: {
            type: Sequelize.STRING(10),
        },
        rssi: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        step: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        rri: {
            type: Sequelize.INTEGER,
        },
        charge: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
        sos: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
        temperature: {
            type: Sequelize.STRING(10),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'data',
        timestamps: false,
        freezeTableName: true,
    }
)

Current_data.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
        },
        mac: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        battery: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        gateway: {
            type: Sequelize.STRING(20),
        },
        hr: {
            type: Sequelize.INTEGER,
        },
        rssi: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        pair_type: {
            type: Sequelize.STRING(10),
            allowNull: true,
        },
        temperature: {
            type: Sequelize.STRING(10),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'current_data',
        timestamps: false,
        freezeTableName: true,
    }
)

Five_minute_hrv.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        hrr: {
            type: Sequelize.REAL,
        },
        rmssd: {
            type: Sequelize.REAL,
        },
        sdnn: {
            type: Sequelize.REAL,
        },
        frequency: {
            type: Sequelize.REAL,
        },
    },
    {
        sequelize,
        modelName: '5minute_hrv',
        timestamps: false,
        freezeTableName: true,
    }
)

One_hour_hrv.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        hrr: {
            type: Sequelize.REAL,
        },
        rmssd: {
            type: Sequelize.REAL,
        },
        sdnn: {
            type: Sequelize.REAL,
        },
        frequency: {
            type: Sequelize.REAL,
        },
    },
    {
        sequelize,
        modelName: '1hour_hrv',
        timestamps: false,
        freezeTableName: true,
    }
)

One_day_hrv.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        hrr: {
            type: Sequelize.REAL,
        },
        rmssd: {
            type: Sequelize.REAL,
        },
        sdnn: {
            type: Sequelize.REAL,
        },
        frequency: {
            type: Sequelize.REAL,
        },
    },
    {
        sequelize,
        modelName: '1day_hrv',
        timestamps: false,
        freezeTableName: true,
    }
)

One_week_hrv.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        hrr: {
            type: Sequelize.REAL,
        },
        rmssd: {
            type: Sequelize.REAL,
        },
        sdnn: {
            type: Sequelize.REAL,
        },
        frequency: {
            type: Sequelize.REAL,
        },
    },
    {
        sequelize,
        modelName: '1week_hrv',
        timestamps: false,
        freezeTableName: true,
    }
)

One_month_hrv.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        hrr: {
            type: Sequelize.REAL,
        },
        rmssd: {
            type: Sequelize.REAL,
        },
        sdnn: {
            type: Sequelize.REAL,
        },
        frequency: {
            type: Sequelize.REAL,
        },
    },
    {
        sequelize,
        modelName: '1month_hrv',
        timestamps: false,
        freezeTableName: true,
    }
)

Five_minute_hr.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        max_hr: {
            type: Sequelize.INTEGER,
        },
        mean_hr: {
            type: Sequelize.REAL,
        },
        min_hr: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: '5minute_hr',
        timestamps: false,
        freezeTableName: true,
    }
)

One_hour_hr.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        max_hr: {
            type: Sequelize.INTEGER,
        },
        mean_hr: {
            type: Sequelize.REAL,
        },
        min_hr: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: '1hour_hr',
        timestamps: false,
        freezeTableName: true,
    }
)

One_day_hr.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        max_hr: {
            type: Sequelize.INTEGER,
        },
        mean_hr: {
            type: Sequelize.REAL,
        },
        min_hr: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: '1day_hr',
        timestamps: false,
        freezeTableName: true,
    }
)

One_week_hr.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        max_hr: {
            type: Sequelize.INTEGER,
        },
        mean_hr: {
            type: Sequelize.REAL,
        },
        min_hr: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: '1week_hr',
        timestamps: false,
        freezeTableName: true,
    }
)

One_month_hr.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        timestamp: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        max_hr: {
            type: Sequelize.INTEGER,
        },
        mean_hr: {
            type: Sequelize.REAL,
        },
        min_hr: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: '1month_hr',
        timestamps: false,
        freezeTableName: true,
    }
)

Personnel.init(
    {
        user_id: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(10),
        },
        birthday: {
            type: Sequelize.BIGINT,
        },
        sex: {
            type: Sequelize.STRING(10),
        },
        mac: {
            type: Sequelize.STRING(20),
        },
        create_date: {
            type: Sequelize.BIGINT,
        },
        update_date: {
            type: Sequelize.BIGINT,
        },
    },
    {
        sequelize,
        modelName: 'personnel',
        timestamps: false,
        freezeTableName: true,
    }
)

User.init(
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: Sequelize.STRING(20),
        },
        password: {
            type: Sequelize.STRING(20),
        },
    },
    {
        sequelize,
        modelName: 'user',
        timestamps: false,
        freezeTableName: true,
    }
)

Gateway.init(
    {
        gateway: {
            type: Sequelize.STRING(20),
            primaryKey: true,
            unique: true,
        },
        location: {
            type: Sequelize.STRING(10),
        },
        piStatus: {
            type: Sequelize.BIGINT,
        },
    },
    {
        sequelize,
        modelName: 'gateway',
        timestamps: false,
        freezeTableName: true,
    }
)

Wristband.init(
    {
        mac: {
            type: Sequelize.STRING(20),
            primaryKey: true,
        },
        pair_type: {
            type: Sequelize.STRING(10),
        },
        user_id: {
            type: Sequelize.STRING(20),
            unique: true,
        },
    },
    {
        sequelize,
        modelName: 'wristband',
        timestamps: false,
        freezeTableName: true,
    }
)

sequelize.sync()
User.create({ username: 'admin', password: 'admin123456' }).catch((err) => console.log(err))
module.exports = {
    Data,
    Current_data,
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
    Personnel,
    User,
    Gateway,
    Wristband,
}
