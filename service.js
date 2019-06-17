const { notificator } = require('./notificator');
const { dbUrl } = require('./config');

notificator.connectToDB(dbUrl);
notificator.sendNotifications('tst msg')
  .catch((err) => { console.log(err); });
