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
  const updateUserId = (player) => {
    lastUserId = player;
  };
  let elements = PlayerSchema
    .aggregate([
      { $limit: 100 },
      { $group: { _id: null, id: { $addToSet: '$id' } } },
    ]);
  /*
    .find({}, { id: 1, _id: 0 })
    .limit(100);
  */
  let players = [];
  players = (await elements)[0].id;
  logger.info(`players length ${players.length}`);
  lastUserId = players[players.length - 1];
  logger.info(`first el ${players.length} ${lastUserId}`);
  setInterval(async () => {
    elements = PlayerSchema
      .aggregate([
        { $limit: 100 },
        {
          $project: {
            id: { $gt: ['$id', lastUserId] },
          },
        },
        { $group: { _id: null, id: { $addToSet: '$id' } } },
      ]);
    const allElements = (await elements);
    players = allElements[0].id;
    logger.info(`players length ${players.length}`);
    /*
    elements.find({ id: { $gt: lastUserId } })
      .limit(100);
    */
    // logger.info(`el ${lastUserId}} length: ${players.length}`);
    try {
      console.log(players);
      vkAPI.sendNotification(players, 'tst msg');
    } catch (err) {
      logger.error(err);
      logger.error(vkAPI.errorToString(err));
    }
    players.forEach(updateUserId);
  }, 3500);
  logger.info('finish');
}());
