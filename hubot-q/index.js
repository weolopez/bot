var Adapter, Robot, Shell, TextMessage, chalk, cline, fs, historyPath, historySize, readline, stream;

try {
  ref = require('hubot'), Robot = ref.Robot, Adapter = ref.Adapter, TextMessage = ref.TextMessage, User = ref.User;
} catch (_error) {
  prequire = require('parent-require');
  ref1 = prequire('hubot'), Robot = ref1.Robot, Adapter = ref1.Adapter, TextMessage = ref1.TextMessage, User = ref1.User;
}

  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

fs = require('fs');

readline = require('readline');

stream = require('stream');

cline = require('cline');

chalk = require('chalk');

//Adapter = require('adapter');

//TextMessage = require('../message').TextMessage;

historySize = process.env.HUBOT_SHELL_HISTSIZE != null ? parseInt(process.env.HUBOT_SHELL_HISTSIZE) : 1024;

historyPath = ".hubot_history";

Shell = (function(superClass) {
  extend(Shell, superClass);

  function Shell() {
    return Shell.__super__.constructor.apply(this, arguments);
  }

  Shell.prototype.send = function() {
    var envelope, i, len, results, str, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    results = [];
    for (i = 0, len = strings.length; i < len; i++) {
      str = strings[i];
      results.push(console.log(chalk.bold("" + str)));
    }
    return results;
  };

  Shell.prototype.emote = function() {
    var envelope, i, len, results, str, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    results = [];
    for (i = 0, len = strings.length; i < len; i++) {
      str = strings[i];
      results.push(this.send(envelope, "* " + str));
    }
    return results;
  };

  Shell.prototype.reply = function() {
    var envelope, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    strings = strings.map(function(s) {
      return envelope.user.name + ": " + s;
    });
    return this.send.apply(this, [envelope].concat(slice.call(strings)));
  };

  Shell.prototype.run = function() {
    this.buildCli();
    return this.loadHistory((function(_this) {
      return function(history) {
        _this.cli.history(history);
        _this.cli.interact(_this.robot.name + "> ");
        return _this.emit('connected');
      };
    })(this));
  };

  Shell.prototype.shutdown = function() {
    this.robot.shutdown();
    return process.exit(0);
  };

  Shell.prototype.buildCli = function() {
    this.cli = cline();
    this.cli.command('*', (function(_this) {
      return function(input) {
        var user, userId, userName;
        userId = process.env.HUBOT_SHELL_USER_ID || '1';
        if (userId.match(/\A\d+\z/)) {
          userId = parseInt(userId);
        }
        userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell';
        user = _this.robot.brain.userForId(userId, {
          name: userName,
          room: 'Shell'
        });
        return _this.receive(new TextMessage(user, input, 'messageId'));
      };
    })(this));
    this.cli.command('history', (function(_this) {
      return function() {
        var i, item, len, ref, results;
        ref = _this.cli.history();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          results.push(console.log(item));
        }
        return results;
      };
    })(this));
    this.cli.on('history', (function(_this) {
      return function(item) {
        if (item.length > 0 && item !== 'exit' && item !== 'history') {
          return fs.appendFile(historyPath, item + "\n", function(err) {
            if (err) {
              return _this.robot.emit('error', err);
            }
          });
        }
      };
    })(this));
    return this.cli.on('close', (function(_this) {
      return function() {
        var history, i, item, len, outstream, startIndex;
        history = _this.cli.history();
        if (history.length > historySize) {
          startIndex = history.length - historySize;
          history = history.reverse().splice(startIndex, historySize);
          outstream = fs.createWriteStream(historyPath);
          outstream.on('finish', function() {
            return _this.shutdown();
          });
          for (i = 0, len = history.length; i < len; i++) {
            item = history[i];
            outstream.write(item + "\n");
          }
          return outstream.end(function() {
            return _this.shutdown();
          });
        } else {
          return _this.shutdown();
        }
      };
    })(this));
  };

  Shell.prototype.loadHistory = function(callback) {
    return fs.exists(historyPath, function(exists) {
      var instream, items, outstream, rl;
      if (exists) {
        instream = fs.createReadStream(historyPath);
        outstream = new stream;
        outstream.readable = true;
        outstream.writable = true;
        items = [];
        rl = readline.createInterface({
          input: instream,
          output: outstream,
          terminal: false
        });
        rl.on('line', function(line) {
          line = line.trim();
          if (line.length > 0) {
            return items.push(line);
          }
        });
        return rl.on('close', function() {
          return callback(items);
        });
      } else {
        return callback([]);
      }
    });
  };

  return Shell;

})(Adapter);

exports.use = function(robot) {
  return new Shell(robot);
};

