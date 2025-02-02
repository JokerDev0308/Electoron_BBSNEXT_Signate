import fs from 'fs';
import http, { ClientRequest, IncomingMessage } from 'http';
import { EventEmitter } from 'events';
import ResponseStatus from '../enums/response-status';
import { deleteFile } from '../util/file-util';

/* eslint no-console: off */
export class AssetDownloader extends EventEmitter {
  private readonly RETRY_DELAY = 3000;

  private readonly MAX_RETRY = 3;

  private request?: ClientRequest;

  private retryTimer?: NodeJS.Timeout;

  private retryCount = 0;

  private url!: string;

  private savePath!: string;

  download(url: string, savePath: string): AssetDownloader {
    this.url = url;
    this.savePath = savePath;
    this.makeRequest();
    return this;
  }

  stop(): void {
    if (this.request) {
      this.request.destroy();
      this.request.removeAllListeners();
      this.request = undefined;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    deleteFile(this.savePath);
    this.removeAllListeners();
  }

  private complete(error?: Error): void {
    if (error) {
      this.emit('error', error);
    } else {
      this.emit('complete');
    }
    this.removeAllListeners();
  }

  private retry(): void {
    console.log('Retrying download', this.url);
    this.retryTimer = setTimeout(this.makeRequest, this.RETRY_DELAY);
  }

  private makeRequest = (): void => {
    this.request = http.get(this.url, (response) => {
      const { statusCode } = response;

      if (statusCode === ResponseStatus.SUCCESS) {
        this.writeFile(response);
        return;
      }

      // Consume response data to free up memory
      response.resume();

      if (statusCode === ResponseStatus.TOO_MANY_REQUESTS) {
        console.log('Too many request');
        // No retry limit.
        // Always retry until accepted by server.
        this.retry();
      }
    });
    this.request.on('error', (err: Error) => {
      if (this.retryCount === this.MAX_RETRY) {
        console.log('download retry limit reached');
        this.complete(err);
      } else {
        this.retry();
        this.retryCount += 1;
      }
    });
  };

  private writeFile(response: IncomingMessage): void {
    const len = Number(response.headers['content-length']);
    const writeFile = fs.createWriteStream(this.savePath);
    let downloaded = 0;
    let progress = 0;

    response
      .on('data', (chunk) => {
        writeFile.write(chunk);
        downloaded += chunk.length;
        // Round off to whole number
        const percent = Math.floor((100.0 * downloaded) / len);
        if (progress !== percent) {
          progress = percent;
          this.emit('progress', progress);
        }
      })
      .on('end', () => {
        writeFile.end();
        if (progress === 100) {
          this.complete();
        }
      });
  }
}

export declare interface AssetDownloader {
  on(event: 'start', callback: () => void): this;
  on(event: 'complete', callback: () => void): this;
  on(event: 'progress', callback: (progress: number) => void): this;
  on(event: 'error', callback: (error: Error) => void): this;
}
