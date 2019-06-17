
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// eslint-disable-next-line no-unused-vars
class VKAPI {
  constructor() {
    this.errorMap = new Map();
    this.errorMap.set(1, 'Too frequently');
    this.errorMap.set(2, 'Server fatal error');
    this.errorMap.set(3, 'Invalid data');
    this.timeExecuteSend = false;
  }

  errorToString(error) {
    return this.errorMap.get(parseInt(error.message, 10));
  }

  // eslint-disable-next-line consistent-return
  sendNotification(ids, message) {
    if (this.timeExecuteSend) {
      throw new Error(1);
    }
    if (getRandomInt(0, 50) === 1) {
      throw new Error(2);
    }
    if (!Array.isArray(ids)) {
      throw new Error(3);
    }
    const users = [];
    ids.forEach((id) => {
      if (getRandomInt(0, 5) === 1) {
        console.log(`${message} sended to ${id}`);
        users.push(id);
      }
    });
    console.log(users.length);
    this.timeExecuteSend = true;
    setTimeout(() => {
      this.timeExecuteSend = false;
    }, 3000);
    return users;
  }
}
module.exports = { vkAPI: new VKAPI() };
