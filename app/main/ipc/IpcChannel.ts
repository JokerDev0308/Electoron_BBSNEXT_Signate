import { IpcMainEvent } from 'electron';

export interface IpcChannel {
  readonly name: string;

  handle(event: IpcMainEvent, request: any): void;
}
