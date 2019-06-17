const log4js = require('log4js');
const fs = require('fs');
const { mongoose, PlayerSchema } = require('./schemas');
const { vkAPI } = require('./vk-api');

const logger = log4js.getLogger();
logger.level = 'debug';
const timer = ms => new Promise(res => setTimeout(res, ms));
class Notificator {
  constructor(mongoDB, messageLimit, cacheFileName, delay) {
    this.lastUserId = 0;
    try {
      this.lastUserId = new mongoDB.Types.ObjectId(
        JSON.parse(fs.readFileSync(cacheFileName)),
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
        logger.info('connected to mongodb');
      })
      .catch(err => logger.error(err));
  }

  async sendNotification(message, dbArray) {
    this.lastUserId = dbArray.lastId;
    fs.writeFile('currentIdDB.json', JSON.stringify(this.lastUserId), (err) => {
      if (err) throw err;
    });
    let players = dbArray.id;
    if (players.length === 0) {
      throw new Error('players array empty');
    }
    const vkSender = async (users, msg) => {
      try {
        players = vkAPI.sendNotification(users, msg);
      } catch (err) {
        logger.error(err.message);
        if ((err.message === '2')) {
          process.exit(1);
        } else if ((err.message === '1')) {
          await timer(300);
          players = await vkSender(users, msg)
            .catch((error) => { throw error; });
        } else {
          throw err;
        }
      }
    };
    logger.info(`players length ${players.length}`);
    players = await vkSender(players, message)
      .catch((err) => { throw err; });
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
      this.sendNotification(message, idDocs[0])
        .catch((err) => { throw err; });
      this.elements = PlayerSchema
        .aggregate([
          { $match: { _id: { $gt: this.lastUserId } } },
          { $limit: this.messageLimit },
          { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
        ]);
      await timer(this.delay);
    }
    fs.writeFile('currentIdDB.json', '', (err) => {
      if (err) throw err;
    });
  }
}
module.exports = { notificator: new Notificator(mongoose, 100, 'currentIdDB.json', 300) };

// connectToDB(dbUrl);
