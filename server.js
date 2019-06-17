const log4js = require('log4js');
const { dbUrl } = require('./config');
const { mongoose, PlayerSchema } = require('./schemas');
const { vkAPI } = require('./vk-api');

const logger = log4js.getLogger();
logger.level = 'debug';

function connectToDB(url) {
  mongoose.connect(url, { useNewUrlParser: true })
    .then(() => {
      logger.info('connected to mongodb');
    })
    .catch(err => logger.error(err));
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function generateData() {
  let i = 0;
  try {
    while (i < 1e3) {
      const player = new PlayerSchema({ id: i, firstName: makeid(10) });
      const saved = await player.save();
      logger.info(`player saved: ${saved}`);
      i += 1;
    }
  } catch (err) {
    logger.error(`Mongoose save: ${JSON.stringify(err)}`);
  }
}

connectToDB(dbUrl);
// generateData();

(async function sendNotifications() {
  let lastUserId;
  let elements = PlayerSchema
    .aggregate([
      { $limit: 100 },
      { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
    ]);
  let players = [];
  let idDocs = (await elements);
  players = idDocs[0].id;
  logger.info(`players length ${players.length}`);
  lastUserId = idDocs[0].lastId;
  logger.info(`first el ${players.length} ${lastUserId}`);
  setInterval(async () => {
    elements = PlayerSchema
      .aggregate([
        { $match: { _id: { $gt: lastUserId } } },
        { $limit: 100 },
        { $group: { _id: null, lastId: { $last: '$_id' }, id: { $addToSet: '$id' } } },
      ]);
    idDocs = (await elements);
    players = idDocs[0].id;
    logger.info(`players length ${players.length}`);
    /*
    elements.find({ id: { $gt: lastUserId } })
      .limit(100);
    */
    // logger.info(`el ${lastUserId}} length: ${players.length}`);
    try {
      vkAPI.sendNotification(players, 'tst msg');
    } catch (err) {
      logger.error(vkAPI.errorToString(err));
    }
    lastUserId = idDocs[0].lastId;
    logger.info(lastUserId);
  }, 600);
  logger.info('finish');
}());
