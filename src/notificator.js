const log4js = require('log4js');
const fs = require('fs');
const { mongoose, PlayerSchema } = require('./schemas');
const { vkAPI } = require('../vkapi/vk-api');
/*
log4js.configure({
  appenders: { file: { type: 'file', filename: 'logs/vkapi.log' } },
  categories: { default: { appenders: ['file'], level: 'info' } },
});
*/
const logger = log4js.getLogger('Notificator');
logger.level = 'debug';
const timer = ms => new Promise(res => setTimeout(res, ms));
class Notificator {
  constructor(mongoDB, messageLimit, cacheFileName, delay) {
    this.lastUserId = 0;
    this.cacheFileName = cacheFileName;
    try {
      this.lastUserId = new mongoDB.Types.ObjectId(
        JSON.parse(fs.readFileSync(this.cacheFileName)),
      );
    } catch (err) {
      logger.info(err.name);
    }
    this.elements = {};
    this.mongoose = mongoDB;
    this.delay = delay;
    this.messageLimit = messageLimit;
  }

  connectToDB(url) {
    this.mongoose.connect(url, { useNewUrlParser: true })
      .then(() => {
        logger.info('connected to db');
      })
      .catch(err => logger.error(err));
  }

  async sendNotification(message, dbArray) {
    this.lastUserId = dbArray.lastId;
    await fs.writeFileSync(this.cacheFileName,
      JSON.stringify(this.lastUserId),
      (err) => {
        if (err) throw err;
      });
    let players = dbArray.id;
    let returnUsers = [];
    if (players.length === 0) {
      throw new Error('players array empty');
    }
    const vkSender = async (users, msg) => {
      try {
        returnUsers = vkAPI.sendNotification(users, msg);
        logger.info(`Message "${message}" sended to: ${returnUsers}`);
      } catch (err) {
        logger.error(vkAPI.errorToString(err));
        if ((err.message === '2')) {
          process.exit(1);
        } else if ((err.message === '1')) {
          await timer(this.delay);
          vkSender(users, msg)
            .then((data) => { players = data; })
            .catch((error) => { throw error; });
        }
      }
    };
    await vkSender(players, message)
      .catch((err) => { throw err; });
    logger.info(`returnUsers length ${returnUsers.length}`);
    logger.info(this.lastUserId);
    return players;
  }

  async sendNotifications(message) {
    this.elements = PlayerSchema
      .aggregate([
        { $limit: this.messageLimit },
        { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
      ]);
    if (this.lastUserId === 0) {
      this.lastUserId = (await this.elements)[0].lastId;
    }
    for (let idDocs = (await this.elements); idDocs.length !== 0; idDocs = (await this.elements)) {
      await this.sendNotification(message, idDocs[0])
        .catch((err) => { throw err; });
      this.elements = PlayerSchema
        .aggregate([
          { $match: { _id: { $gt: this.lastUserId } } },
          { $limit: this.messageLimit },
          { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
        ]);
      await timer(this.delay);
    }
    await fs.writeFile(this.cacheFileName, '', (err) => {
      if (err) throw err;
    });
  }
}
module.exports = { notificator: new Notificator(mongoose, 100, 'currentIdDB.json', 335) };

// connectToDB(dbUrl);