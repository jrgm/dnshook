#!/usr/bin/env node

const
cjson = require('cjson'),
dns = require('native-dns'),
fs = require('fs'),
optimist = require('optimist'),
winston = require('winston');

var logger;

function configureLogging(options) {
  var config = {
    timestamp: function () { return new Date().toISOString(); },
    filename: options.logfile || './logging.log',
    handleExceptions: true,
    exitOnError: false,
  };

  logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(config),
      new (winston.transports.File)(config),
    ]
  });

  // monkeypatch winston to accept multiple args like console.log
  var levels = {};
  Object.keys(winston.config.syslog.levels).forEach(function(level) {
    levels[level] = logger[level];
    logger[level] = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      levels[level](args.join(' '));
    };
  });
}

function configure() {
  function configError(message) {
    console.log('\nError:', message);
    argv.showHelp();
    process.exit(1);
  }

  const usage = 'Remap DNS requests for some.host.tld to use a specific ELB in an AWS region';
  const options = {
    'help': {
      'describe': 'display this usage message'
    },
    'real-resolver': {
      'describe': ('what resolver to use for domains we are not intercepting, ' +
                   'or for when we need to get the real answer'),
      'default': '8.8.8.8' // Google public DNS
    },
    'port': {
      'describe': 'what port to bind',
      'default': 53
    },
    'config-file': {
      'describe': 'path/to/config.json',
      'default': './config.json'
    },
    'logfile': {
      'describe': 'path/to/logging.log',
      'default': './logging.log'
    },
  };

  var argv = optimist
    .usage('\n' + usage + '\n\nUsage: $0 [options]')
    .options(options).wrap(80);
  var args = argv.argv;

  if (args.help) {
    argv.showHelp();
    process.exit(0);
  }

  if (args.port < 1024 && process.getuid() !== 0) {
    console.log('Sorry, this program must be run with sudo, so it can bind to port',
                args.port);
    process.exit(0);
  }

  var config = cjson.load(args['config-file']);
  args.domains = config.domains;

  if (!args['real-resolver'].match(/(\d+\.){3}\d+/)) {
    configError(args['real-resolver'] + ' does not appear to be an IP address');
  }

  configureLogging(args);

  logger.info('Using configuration:');
  [ 'real-resolver', 'port', 'config-file', 'logfile' ].forEach(function(opt) {
    logger.info(opt, args[opt]);
  });

  return args;
}

(function run() {
  var args = configure();
  var server = dns.createServer();

  var pickOne = function(list) {
    return list[parseInt(Math.random() * list.length, 10)];
  };

  server.on('request', function(request, response) {
    var interceptedDomain;
    var domain = request.question[0].name;
    logger.info('server.request', 'for', domain);

    if (args.domains[domain]) {
      logger.info('server.request', 'intercepting request for', domain);
      interceptedDomain = domain;
      domain = pickOne(args.domains[domain]);
    }

    logger.info('server.request', 'forwarding request for', domain);
    var req = dns.Request({
      question: dns.Question({ name: domain, type: 'A' }),
      server: {
        address: args['real-resolver'],
        port: args.port,
        type: 'udp'
      },
      timeout: 5000,
    });

    req.on('end', function() {
        logger.info('request.end', req.question.name);
    });

    [ 'timeout', 'cancelled' ].forEach(function(evt) {
      req.on(evt, function() {
        logger.error('request.' + evt, req.question.name);
      });
    });

    req.on('error', function(err) {
      logger.error('request.error', req.question.name, err.stack);
    });

    req.on('message', function(err, answer) {
      if (err) {
        return logger.error('request.message', 'handling response for',
                            req.question.name, err.stack);
      }

      logger.info('request.message', 'handling response for', req.question.name);

      answer.answer.forEach(function(ans) {
        var name = dns.consts.QTYPE_TO_NAME[ans.type];
        if (name === 'A' && interceptedDomain) {
          logger.info('request.message', 'fix intercept', interceptedDomain,
                      'for', domain, 'ip', ans.address);
          ans.name = interceptedDomain;
        }
        response.answer.push(dns[name](ans));
      });
      response.send();
    });
    req.send();
  });

  server.on('error', function(err, msg /*, response */) {
    logger.error('server.error', err.stack, msg);
  });

  server.on('socketError', function(err) {
    logger.error('server.socketError', err.stack);
  });

  [ 'listening', 'close' ].forEach(function(evt) {
    server.on(evt, function() {
      logger.info('server.' + evt);
    });
  });

  server.serve(args.port, '127.0.0.1');
  logger.info('Listening on 127.0.0.1:' + args.port, 'for', Object.keys(args.domains).join(', '));
})();
