const log4js = require('log4js');
const { mongoose, PlayerSchema } = require('./schemas');
const { vkAPI } = require('./vk-api');

const logger = log4js.getLogger();
logger.level = 'debug';

class Notificator {
  constructor(mongoDB, messageLimit) {
    this.lastUserId = 0;
    this.elements = {};
    this.mongoose = mongoDB;
    this.maxDelay = 350;
    this.messageLimit = messageLimit;
  }

  connectToDB(url) {
    this.mongoose.connect(url, { useNewUrlParser: true })
      .then(() => {
        logger.info('connected to mongodb');
      })
      .catch(err => logger.error(err));
  }

  async sendNotification(message, dbArray) {
    let players = dbArray.id;
    if (players.length === 0) {
      throw new Error('players array empty');
    }
    logger.info(`players length ${players.length}`);
    try {
      players = vkAPI.sendNotification(players, message);
    } catch (err) {
      logger.error(err.toString());
    }
    this.lastUserId = dbArray.lastId;
    logger.info(this.lastUserId);
    return players;
  }

  async sendNotifications(message) {
    this.elements = PlayerSchema
      .aggregate([
        { $limit: this.messageLimit },
        { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
      ]);
    let idDocs = (await this.elements);
    if (idDocs.length === 0) {
      throw new Error('players collection is empty');
    }
    await this.sendNotification(message, idDocs[0]);

    const getUsers = async () => {
      this.elements = PlayerSchema
        .aggregate([
          { $match: { _id: { $gt: this.lastUserId } } },
          { $limit: this.messageLimit },
          { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
        ]);
      idDocs = (await this.elements);
      if (idDocs.length === 0) {
        throw Error('');
      }
      await this.sendNotification(message, idDocs[0])
        .catch((err) => { throw err; });
    };   
    let timer = setTimeout(() => {
      timer = setTimeout(getUsers(timer), 350);
    }, 350);
  }

  calculateSleepTime(attempt, backoff) {
    let sleepTime = (2 ** attempt) * backoff;
    if (sleepTime > this.maxDelay) {
      sleepTime = this.maxDelay;
    }
    logger.info(`sleep time ${sleepTime}`);
    return sleepTime;
  }
}
module.exports = { notificator: new Notificator(mongoose, 100) };

// connectToDB(dbUrl);
