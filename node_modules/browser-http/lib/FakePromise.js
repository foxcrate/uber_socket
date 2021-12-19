(function() {
  var FakePromise;

  FakePromise = (function() {
    function FakePromise() {}

    FakePromise.prototype._error = function() {
      throw new Error('Please, use callbacks instead of promise pattern.');
    };

    FakePromise.prototype.then = function() {
      return this._error();
    };

    FakePromise.prototype["catch"] = function() {
      return this._error();
    };

    FakePromise.prototype.fail = function() {
      return this._error();
    };

    FakePromise.prototype.done = function() {
      return this._error();
    };

    return FakePromise;

  })();

  module.exports = FakePromise;

}).call(this);
