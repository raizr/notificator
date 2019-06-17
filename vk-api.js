const log4VK = require('log4js');
/*
log4VK.configure({
  appenders: { file: { type: 'file', filename: 'logs/vkapi.log' } },
  categories: { default: { appenders: ['file'], level: 'info' } },
});
*/
const logger = log4VK.getLogger('vkapi');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

class VKAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VKAPIError';
  }
}

// eslint-disable-next-line no-unused-vars
class VKAPI {
  constructor() {
    this.errorMap = new Map();
    this.errorMap.set(1, 'Too frequently');
    this.errorMap.set(2, 'Server fatal error');
    this.errorMap.set(3, 'Invalid data');
    this.sendNotifyCounter = 0;
  }

  errorToString(error) {
    return this.errorMap.get(parseInt(error.message, 10));
  }

  // eslint-disable-next-line consistent-return
  sendNotification(ids, message) {
    if (this.sendNotifyCounter >= 3) {
      throw new VKAPIError(1);
    }
    if (getRandomInt(0, 2) === 1) {
      throw new VKAPIError(2);
    }
    if (!Array.isArray(ids)) {
      throw new VKAPIError(3);
    }
    const users = [];
    ids.forEach((id) => {
      if (getRandomInt(0, 50) === 1) {
        if (!Number.isInteger(id)) {
          throw new VKAPIError(3);
        }
        if (id <= 0) {
          throw new VKAPIError(3);
        }
        logger.info(`${message} sended to ${id}`);
        users.push(id);
      }
    });
    logger.info(users.length);
    this.sendNotifyCounter++;
    setTimeout(() => {
      this.sendNotifyCounter = 0;
    }, 1000);
    return users;
  }
}
module.exports = { vkAPI: new VKAPI() };
