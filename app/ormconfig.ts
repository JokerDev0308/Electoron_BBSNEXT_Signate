import { DB_PATH } from './common/constants/path';

// eslint-disable-next-line no-console
console.log(`\nDatabase path: ${DB_PATH}\n`);

// This config is used ONLY for typeorm cli
module.exports = {
  type: 'sqlite',
  logging: true,
  database: DB_PATH,
  entities: [`main/entities/*.ts`],
  migrations: [`main/migrations/*.ts`],
  cli: {
    entitiesDir: `main/entities`,
    migrationsDir: `main/migrations`,
  },
};
