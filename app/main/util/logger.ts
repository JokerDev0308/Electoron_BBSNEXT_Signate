import fs, { existsSync, renameSync } from 'fs';
import moment from 'moment';
import winston from 'winston';
import path, { join } from 'path';
import { APP_DATA_PATH } from '../../common/constants/path';
import LogType from '../../common/constants/log-type';

const logsDir = path.join(APP_DATA_PATH, 'logs');
if (!existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
} else {
  // Rename log files such that it will always use "logs.log"
  // as the initial log file. This is in cases when logs files
  // already reached the maximum size (30mb) in which the logs
  // could look like these:
  // logs2.log, logs3.log, logs4.log, logs5.log, logs6.log, logs7.log
  // The result will look like the following:
  // logs.log, logs1.log, logs2.log, logs3.log, logs4.log, logs5.log
  const files = fs.readdirSync(logsDir);
  const regex = /^logs\d+.log$/;
  let count = 1;
  files
    .filter((file) => regex.test(file))
    .sort()
    .forEach((file, index) => {
      if (index === 0 && !existsSync(join(logsDir, 'logs.log'))) {
        renameSync(join(logsDir, file), join(logsDir, `logs.log`));
        return;
      }
      if (file !== `logs${count}.log`) {
        renameSync(join(logsDir, file), join(logsDir, `logs${count}.log`));
        count += 1;
      }
    });
}

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'logs.log',
      dirname: logsDir,
      maxsize: 5000000,
      maxFiles: 6,
    }),
  ],
});

const writeLog = (logType: LogType, details: string) => {
  logger.log({
    applicationName: 'elecom-windows-signage',
    level: logType,
    message: details,
    logTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
  });
};

export default writeLog;
