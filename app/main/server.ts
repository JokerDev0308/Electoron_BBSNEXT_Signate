import express from 'express';
import { MESSAGEBOARD_PAGE_PATH, UPLOADS_PATH } from '../common/constants/path';
import Port from '../common/constants/port';
import addRoutes from './api/routes';

export default function start() {
  const server = express();

  const routes = addRoutes(server);

  // Serve static files
  server.use('/', express.static(MESSAGEBOARD_PAGE_PATH));
  server.use('/assets/uploads', express.static(UPLOADS_PATH));

  server.listen(Port.SERVER_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\nServer running at port ${Port.SERVER_PORT}\n`);
    routes.forEach((route) => {
      // eslint-disable-next-line no-console
      console.log(`Routes configured ${route.getName()}`);
    });
  });
}
