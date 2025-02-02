import cron, { Job } from 'node-schedule';

export default class Scheduler {
  name: string;

  dateTime: string;

  callback: any;

  cronJob?: Job;

  constructor(name: string, dateTime: string, callback: any) {
    this.name = name;
    this.dateTime = dateTime;
    this.callback = callback;
    this.schedule();
  }

  schedule = () => {
    this.cronJob = cron.scheduleJob(
      this.name,
      this.dateTime,
      (fireDate: Date) => {
        console.log(`Cron job '${this.name}' fired at ${fireDate}`);
        this.callback();
        this.cronJob = undefined;
      }
    );
    console.log(`Cron job created: ${this.name} - ${this.dateTime}`);
  };

  cancel = () => {
    if (this.cronJob) {
      this.cronJob.cancel();
      this.cronJob = undefined;
      console.log(`Cron job cancelled: ${this.name} - ${this.dateTime}`);
    }
  };
}
