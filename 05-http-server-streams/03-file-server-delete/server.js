const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  if (~pathname.indexOf('/')) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }
  switch (req.method) {
    case 'DELETE':
      fs.unlink(filepath, (error) => {
        if (error && error.code === 'ENOENT') {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
        res.statusCode = 200;
        res.end('File was deleted');
      });

      req.on('error', (error) => {
        if (error) {
          res.statusCode = 500;
          res.end('Server error');
        };
      });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
