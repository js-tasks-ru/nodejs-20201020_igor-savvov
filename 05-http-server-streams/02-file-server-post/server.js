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

  let isError = false;

  const errorStatus = (error) => {
    isError = true;
    if (error && error.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('File not found');
      return;
    }
    res.end('File was deleted');
  };

  const errorHandler = (error) => {
    isError = true;
    switch (error.code) {
      case 'EEXIST':
        res.statusCode = 409;
        res.end('Conflict - file exists');
        break;

      case 'LIMIT_EXCEEDED':
        fs.unlink(filepath, errorStatus);
        res.statusCode = 413;
        res.end(`File exceede ${FILE_LIMIT} bytes limit`);
        break;

      default:
        fs.unlink(filepath, errorStatus);
        res.statusCode = 500;
        res.end('Something went wrong');
    }
  };
  switch (req.method) {
    case 'POST':
      if (~pathname.indexOf('/')) {
        res.statusCode = 400;
        res.end('Bad request');
        return;
      }
      const limitStream = new LimitSizeStream({limit: FILE_LIMIT});
      const writeStream = fs.createWriteStream(filepath, {flags: 'wx'});
      limitStream.on('error', errorHandler);
      writeStream.on('error', errorHandler);
      req.on('error', errorHandler);
      req.on('aborted', () => fs.unlink(filepath, errorStatus));
      req.pipe(limitStream).pipe(writeStream);
      writeStream.on('close', () => {
        if (isError) return;
        res.statusCode = 201;
        res.end('File created');
      });
      break;
    default:
      res.statusCode = 501;
      res.end('Not implemented');
      return;
  }
});

module.exports = server;
