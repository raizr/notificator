const http = require('http');
const url = require('url');
const { Notificator, logger } = require('./src/notificator');
// module.exports = { dbUrl: `mongodb://localhost:27017/${dbName}` };
const { dbUrl } = require('./config');

const notificator = new Notificator(100, 'currentIdDB.json', 335);

notificator.connectToDB(dbUrl);

function verifyTemplateMessage(template, maxLength) {
  if (template === undefined || template === '') {
    throw Error('Template is empty');
  }
  if (template.length > maxLength) {
    throw Error(`Template is longer than ${maxLength} characters`);
  }
}

http.createServer((req, res) => {
  const currentUrl = url.parse(req.url, true);
  if (currentUrl.pathname === '/send') {
    try {
      verifyTemplateMessage(currentUrl.query.template, 400);
      notificator.sendNotifications(currentUrl.query.template)
        .catch((err) => { logger.error(err.message); });
      res.writeHead(200);
      res.end('Start sending');
    } catch (err) {
      res.writeHead(404);
      res.end(`Error: ${err.message}`);
    }
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
}).listen(8080);
