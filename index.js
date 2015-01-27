'use strict';
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');
var exec = require('child_process').exec;
var chalk = require('chalk');

//////////////////////////////
// Execute with Callback
//////////////////////////////
function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(stdout); });
};

module.exports = function (options) {
  return es.map(function (file, cb) {
    //////////////////////////////
    // Finish Deploy
    //////////////////////////////
    var deployStart = function() {
      execute('git ls-remote ' + remote + ' ' + branch, function (rmt) {
        if (rmt.length > 0) {
          gutil.log('Cleaning ' + chalk.cyan(remote) + '/' + chalk.cyan(branch));
          execute('git push ' + remote + ' :' + branch, function () {
            deployFinish();
          });
        }
        else {
          deployFinish();
        }
      });
    };

    //////////////////////////////
    // Finish Deploy
    //////////////////////////////
    var deployFinish = function () {
      gutil.log('Pushing ' + chalk.magenta(folder) + ' to ' + chalk.cyan(remote) + '/' + chalk.cyan(branch));
      execute('git subtree push -f --prefix ' + folder + ' ' + remote + ' ' + branch, function () {
        if (!skipCommit) {
          gutil.log('Resetting ' + chalk.magenta(folder) + ' temporary commit');
          execute('git reset HEAD^', function () {
            return cb(null, file);
          });
        }
      });
    };

    //////////////////////////////
    // Does not work with buffers
    //////////////////////////////
    if (file.isBuffer()) {
      return cb(
        new gutil.PluginError("gulp-subtree", "Gulp Subtree is only supported for folders"),
        file
      );
    }

    var folder = file.path.replace(file.cwd + path.sep, '');

    var remote = 'origin';
    var branch = 'gh-pages';
    var message = 'Distribution Commit';
    var skipCommit = false;
    if (options !== undefined) {
      remote = options.remote || remote;
      branch = options.branch || branch;
      message = options.message || message;
      skipCommit = options.skipCommit || skipCommit;
    }

    if (!skipCommit) {
      execute('git add ' + folder + ' && git commit -m "' + message + '"', function () {
        gutil.log('Temporarily committing ' + chalk.magenta(folder));
        deployStart();
      });
    } else {
      deployStart();
    }
  });
};
