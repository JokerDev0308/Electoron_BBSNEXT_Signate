import express from 'express';
import ResponseStatus from '../../enums/response-status';

export default abstract class BaseRouteConfig {
  private readonly API_KEY = '8c7fddad-f465-44f3-a5d7-af1589361bc2';

  app: express.Application;

  name: string;

  protected constructor(app: express.Application, name: string) {
    this.app = app;
    this.name = name;
    this.configureRoutes();
  }

  getName() {
    return this.name;
  }

  authenticate(request: express.Request, response: express.Response): boolean {
    const apiKey = request.headers['x-api-key'];
    if (this.API_KEY === apiKey) {
      return true;
    }
    response.status(ResponseStatus.UNAUTHORIZED);
    response.send('Unauthorized');
    return false;
  }

  internalError = (error: Error, response: express.Response): void => {
    response.status(ResponseStatus.INTERNAL_ERROR);
    response.send('Internal error');
    // eslint-disable-next-line no-console
    console.error(error);
  };

  conflictError = (error: Error, response: express.Response): void => {
    response.status(ResponseStatus.CONFLICT);
    response.send('Conflict');
    // eslint-disable-next-line no-console
    console.error(error);
  };

  abstract configureRoutes(): express.Application;
}
