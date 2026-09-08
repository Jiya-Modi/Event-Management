const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, {
    recursive: true,
  });
}

const getDailyLogStream = () => {
  return rfs.createStream(
    (time) => {
      if (!time) {
        const date = new Date();

        const formattedDate = date.toISOString().split('T')[0];

        return `access-${formattedDate}.log`;
      }

      const formattedDate = time.toISOString().split('T')[0];

      return `access-${formattedDate}.log`;
    },
    {
      interval: '1d',
      path: logsDir,
    },
  );
};

const accessLogStream = getDailyLogStream();

// morgan.token('req-body', (req) => JSON.stringify(req.body || {}));
// morgan.token('query', (req) => JSON.stringify(req.query || {}));
// morgan.token('path-params', (req) => JSON.stringify(req.params || {}));

// const morganFormat =
//   ':method :url :status | Params: :path-params | Query: :query | ReqBody: :req-body';

// const morganMiddleware = morgan(morganFormat, {
//   stream: accessLogStream,
// });

const morganMiddleware = morgan('combined', {
  stream: accessLogStream,
});

module.exports = morganMiddleware;
