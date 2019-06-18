const log4js = require('log4js');
const http = require('http');
const url = require('url');
const { notificator } = require('./src/notificator');
const { dbUrl } = require('./config');

const log = log4js.getLogger();

notificator.connectToDB(dbUrl);
/*
notificator.sendNotifications('tst msg')
  .catch((err) => { log.error(err.message); });
*/

function verifyTemplateMessage(template, maxLength) {
  if (template === undefined || template === "") {
    throw Error('Template is empty');
  }
  if (template.length > maxLength) {
    throw Error(`Template too long ${maxLength}`);
  }
}

http.createServer((req, res) => {
  const currentUrl = url.parse(req.url, true);
  if (currentUrl.pathname === '/send') {
    try {
      verifyTemplateMessage(currentUrl.query.template, 400);
      notificator.sendNotifications(currentUrl.query.template);
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
