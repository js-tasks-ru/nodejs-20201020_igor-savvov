const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      // Nested route
      if (~pathname.indexOf('/')) {
        res.statusCode = 400;
        res.end('Bad request');
        return;
      }
      fs.createReadStream(filepath).on('error', (error) => {
        // No such file or directory
        if (error.code === 'ENOENT') {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        res.statusCode = 500;
        res.end('Something went wrong');
      }).pipe(res);
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
