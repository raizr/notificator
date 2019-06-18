const log4js = require('log4js');

const log = log4js.getLogger();
const { notificator } = require('./notificator');
const { dbUrl } = require('./config');

notificator.connectToDB(dbUrl);
notificator.sendNotifications('tst msg')
  .catch((err) => { log.error(err.message); });
