(function() {

  module('Functions');

  asyncTest('debounce', 1, function() {
    var counter = 0;
    var incr = function(){ counter++; };
    var debouncedIncr = _.debounce(incr, 32);
    debouncedIncr(); debouncedIncr();
    _.delay(debouncedIncr, 16);
    _.delay(function(){ equal(counter, 1, 'incr was debounced'); start(); }, 96);
  });

  asyncTest('debounce asap', 4, function() {
    var a, b;
    var counter = 0;
    var incr = function(){ return ++counter; };
    var debouncedIncr = _.debounce(incr, 64, true);
    a = debouncedIncr();
    b = debouncedIncr();
    equal(a, 1);
    equal(b, 1);
    equal(counter, 1, 'incr was called immediately');
    _.delay(debouncedIncr, 16);
    _.delay(debouncedIncr, 32);
    _.delay(debouncedIncr, 48);
    _.delay(function(){ equal(counter, 1, 'incr was debounced'); start(); }, 128);
  });

  asyncTest('debounce asap recursively', 2, function() {
    var counter = 0;
    var debouncedIncr = _.debounce(function(){
      counter++;
      if (counter < 10) debouncedIncr();
    }, 32, true);
    debouncedIncr();
    equal(counter, 1, 'incr was called immediately');
    _.delay(function(){ equal(counter, 1, 'incr was debounced'); start(); }, 96);
  });

  asyncTest('debounce after system time is set backwards', 2, function() {
    var counter = 0;
    var origNowFunc = _.now;
    var debouncedIncr = _.debounce(function(){
      counter++;
    }, 100, true);

    debouncedIncr();
    equal(counter, 1, 'incr was called immediately');

    _.now = function () {
      return new Date(2013, 0, 1, 1, 1, 1);
    };

    _.delay(function() {
      debouncedIncr();
      equal(counter, 2, 'incr was debounced successfully');
      start();
      _.now = origNowFunc;
    }, 200);
  });

  asyncTest('debounce re-entrant', 2, function() {
    var sequence = [
      ['b1', 'b2']
    ];
    var value = '';
    var debouncedAppend;
    var append = function(arg){
      value += this + arg;
      var args = sequence.pop();
      if (args) {
        debouncedAppend.call(args[0], args[1]);
      }
    };
    debouncedAppend = _.debounce(append, 32);
    debouncedAppend.call('a1', 'a2');
    equal(value, '');
    _.delay(function(){
      equal(value, 'a1a2b1b2', 'append was debounced successfully');
      start();
    }, 100);
  });

  test('once', function() {
    var num = 0;
    var increment = _.once(function(){ return ++num; });
    increment();
    increment();
    equal(num, 1);

    equal(increment(), 1, 'stores a memo to the last value');
  });

  test('Recursive onced function.', 1, function() {
    var f = _.once(function(){
      ok(true);
      f();
    });
    f();
  });

  test('wrap', function() {
    var greet = function(name){ return 'hi: ' + name; };
    var backwards = _.wrap(greet, function(func, name){ return func(name) + ' ' + name.split('').reverse().join(''); });
    equal(backwards('moe'), 'hi: moe eom', 'wrapped the salutation function');

    var inner = function(){ return 'Hello '; };
    var obj   = {name : 'Moe'};
    obj.hi    = _.wrap(inner, function(fn){ return fn() + this.name; });
    equal(obj.hi(), 'Hello Moe');

    var noop    = function(){};
    var wrapped = _.wrap(noop, function(){ return Array.prototype.slice.call(arguments, 0); });
    var ret     = wrapped(['whats', 'your'], 'vector', 'victor');
    deepEqual(ret, [noop, ['whats', 'your'], 'vector', 'victor']);
  });

  test('negate', function() {
    var isOdd = function(n){ return n & 1; };
    equal(_.negate(isOdd)(2), true, 'should return the complement of the given function');
    equal(_.negate(isOdd)(3), false, 'should return the complement of the given function');
  });

  test('compose', function() {
    var greet = function(name){ return 'hi: ' + name; };
    var exclaim = function(sentence){ return sentence + '!'; };
    var composed = _.compose(exclaim, greet);
    equal(composed('moe'), 'hi: moe!', 'can compose a function that takes another');

    composed = _.compose(greet, exclaim);
    equal(composed('moe'), 'hi: moe!', 'in this case, the functions are also commutative');

    // f(g(h(x, y, z)))
    function h(x, y, z) {
      equal(arguments.length, 3, 'First function called with multiple args');
      return z * y;
    }
    function g(x) {
      equal(arguments.length, 1, 'Composed function is called with 1 argument');
      return x;
    }
    function f(x) {
      equal(arguments.length, 1, 'Composed function is called with 1 argument');
      return x * 2;
    }
    composed = _.compose(f, g, h);
    equal(composed(1, 2, 3), 12);
  });

  test('after', function() {
    var testAfter = function(afterAmount, timesCalled) {
      var afterCalled = 0;
      var after = _.after(afterAmount, function() {
        afterCalled++;
      });
      while (timesCalled--) after();
      return afterCalled;
    };

    equal(testAfter(5, 5), 1, 'after(N) should fire after being called N times');
    equal(testAfter(5, 4), 0, 'after(N) should not fire unless called N times');
    equal(testAfter(0, 0), 0, 'after(0) should not fire immediately');
    equal(testAfter(0, 1), 1, 'after(0) should fire when first invoked');
  });

  test('before', function() {
    var testBefore = function(beforeAmount, timesCalled) {
      var beforeCalled = 0;
      var before = _.before(beforeAmount, function() { beforeCalled++; });
      while (timesCalled--) before();
      return beforeCalled;
    };

    equal(testBefore(5, 5), 4, 'before(N) should not fire after being called N times');
    equal(testBefore(5, 4), 4, 'before(N) should fire before being called N times');
    equal(testBefore(0, 0), 0, 'before(0) should not fire immediately');
    equal(testBefore(0, 1), 0, 'before(0) should not fire when first invoked');

    var context = {num: 0};
    var increment = _.before(3, function(){ return ++this.num; });
    _.times(10, increment, context);
    equal(increment(), 2, 'stores a memo to the last value');
    equal(context.num, 2, 'provides context');
  });

}());
