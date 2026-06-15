const chalk = require('chalk');

const logger = {
    info: (...args) => {
        console.log(chalk.cyan(`[${timestamp()}] [INFO]`), ...args);
    },

    success: (...args) => {
        console.log(chalk.green(`[${timestamp()}] [SUCCESS]`), ...args);
    },

    warn: (...args) => {
        console.log(chalk.yellow(`[${timestamp()}] [WARN]`), ...args);
    },

    error: (...args) => {
        console.log(chalk.red(`[${timestamp()}] [ERROR]`), ...args);
    },

    debug: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(chalk.magenta(`[${timestamp()}] [DEBUG]`), ...args);
        }
    },

    command: (user, command, guild) => {
        console.log(
            chalk.blue(`[${timestamp()}] [CMD]`),
            chalk.white(`${user}`),
            chalk.cyan(`used /${command}`),
            chalk.gray(`in ${guild}`)
        );
    },

    system: (...args) => {
        console.log(chalk.hex('#6C3CE1')(`[${timestamp()}] [SYSTEM]`), ...args);
    },
};

function timestamp() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

module.exports = logger;
