import { ConnectionOptions, createConnection } from 'typeorm';
import { DB_PATH } from '../../common/constants/path';
import migrations from './migrations';
import entities from './entities';
import writeLog from '../util/logger';
import LogType from '../../common/constants/log-type';

const options: ConnectionOptions = {
  type: 'sqlite',
  logging: false,//process.env.NODE_ENV === 'development',
  database: DB_PATH,
  entities: [...entities],
  migrations: [...migrations],
  migrationsRun: true,
};

/* eslint no-console: off */
export default async function initDbConnection() {
  await createConnection(options)
    .then((connection) => {
      //console.log(`\nDatabase connected: ${connection.driver.database}\n`);
      //writeLog(LogType.INFO, 'Database connected');
      return connection;
    })
    .catch((error) => {
      //console.log(error);
      writeLog(LogType.ERROR, error.toString());
      return error;
    });
}
