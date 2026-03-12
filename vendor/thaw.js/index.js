'use strict';

/**
 * Minimal thaw.js stub for Node.js compatibility.
 * The full thaw.js library is a browser-oriented async iterator that spreads
 * work across animation frames / setTimeout ticks to avoid blocking the UI.
 * brain.js only uses it inside NeuralNetwork#trainAsync; the vendored
 * brainscan app calls the synchronous train() exclusively, so we only need
 * this stub to satisfy the require() at module-load time and to provide a
 * working fallback should trainAsync ever be called.
 */
function Thaw(array, options) {
  this.array = array;
  this.options = options || {};
  this._stopped = false;
  this._index = 0;
}

Thaw.prototype.stop = function () {
  this._stopped = true;
};

Thaw.prototype.tick = function () {
  var self = this;

  if (self._stopped || self._index >= self.array.length) {
    if (self.options.done) self.options.done();
    return;
  }

  self._index++;
  if (self.options.each) self.options.each();

  if (self._stopped) {
    if (self.options.done) self.options.done();
  } else {
    setTimeout(function () { self.tick(); }, 0);
  }
};

module.exports = Thaw;
