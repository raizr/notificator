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

  sendNotification(ids, message) {
    return new Promise((resolve, reject) => {
      if (this.sendNotifyCounter >= 3) {
        reject(new VKAPIError(1));
      }
      if (getRandomInt(0, 100) === 1) {
        reject(new VKAPIError(2));
      }
      if (!Array.isArray(ids)) {
        reject(new VKAPIError(3));
      }
      if (ids.length === 0 || ids.length > 100) {
        reject(new VKAPIError(3));
      }
      const users = [];
      ids.forEach((id) => {
        if (getRandomInt(0, 2) === 1) {
          if (!Number.isInteger(id)) {
            reject(new VKAPIError(3));
          }
          if (id <= 0) {
            reject(new VKAPIError(3));
          }
          users.push(id);
        }
      });
      this.sendNotifyCounter++;
      setTimeout(() => {
        this.sendNotifyCounter = 0;
      }, 1000);
      resolve(users);
    });
  }
}
module.exports = { vkAPI: new VKAPI() };
