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

function proccessSendRoute(req, res, body) {
  try {
    verifyTemplateMessage(body, 400);
    notificator.sendNotifications(body)
      .catch((err) => { logger.error(err.message); });
    res.writeHead(200);
    res.end('Start sending');
  } catch (err) {
    res.writeHead(404);
    res.end(`Error: ${err.message}`);
  }
}

http.createServer((req, res) => {
  const currentUrl = url.parse(req.url, true);
  if (currentUrl.pathname === '/send') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        // body {"template":"message"}
        proccessSendRoute(req, res, JSON.parse(body).template);
      });
    } else {
      proccessSendRoute(req, res, currentUrl.query.template);
    }
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
}).listen(8080);
