const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const LimitSizeStream = require('./LimitSizeStream');
const FILE_LIMIT = 1024 * 1024; // Equal to 1 MB (1048576 bytes)
const server = new http.Server();

if (!fs.existsSync('./files')) {
  fs.mkdirSync('./files');
}
server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      if (~pathname.indexOf('/')) {
        res.statusCode = 400;
        return res.end('Bad request');
      }
      const limitStream = new LimitSizeStream({limit: FILE_LIMIT});
      const writeStream = fs.createWriteStream(filepath, {flags: 'wx'});
      req.pipe(limitStream).pipe(writeStream);

      writeStream.on('error', (err) => {
        if (err.code === 'EEXIST') {
          res.statusCode = 409;
          res.end('Conflict - file exists');
        } else {
          res.statusCode = 500;
          res.end('Something went wrong');
        }
      });
      writeStream.on('close', () => {
        res.statusCode = 201;
        res.end('File created');
      });
      limitStream.on('error', () => {
        res.statusCode = 413;
        res.end(`File exceede ${FILE_LIMIT} bytes limit`);
        fs.unlink(filepath, () => {});
      });
      res.on('close', () => {
        if (res.finished) return;
        res.end('Connection failure');
        fs.unlink(filepath, () => {});
      });
      break;
    default:
      res.statusCode = 501;
      res.end('Not implemented');
      return;
  }
});

module.exports = server;
