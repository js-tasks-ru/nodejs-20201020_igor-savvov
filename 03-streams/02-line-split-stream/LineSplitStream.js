const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this._encoding = this.encoding;
    this._lastData = '';
  }
  _transform(chunk, encoding, callback) {
    let data = chunk.toString(this._encoding);
    if (this._lastData) data = this._lastData + data; // Check if some write calls
    const lines = data.split(os.EOL);
    this._lastData = lines.splice(lines.length-1, 1)[0]; // The last string
    lines.forEach((el) => this.push(el));
    callback();
  }

  _flush(callback) {
    if (this._lastData) this.push(this._lastData);
    this._lastData = null;
    callback();
  }
}

module.exports = LineSplitStream;
