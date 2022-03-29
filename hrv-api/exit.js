const api = {
    // 關閉 node
    exit: async function (ctx) {
        try {
            process.kill(process.pid, 'SIGTERM')
        } catch (error) {
            ctx.response.body = error
        }
    },
}

module.exports = api
