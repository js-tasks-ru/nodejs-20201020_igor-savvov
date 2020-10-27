function sum(a, b) {
  [...arguments].forEach((arg) => {
    if (typeof arg !== 'number') throw new TypeError(`Аргумент является ${typeof arg}`);
  });
  return a + b;
}

module.exports = sum;
