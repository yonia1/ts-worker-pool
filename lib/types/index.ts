import { MessageChannel, Worker } from 'worker_threads';

export interface IWorkerPollWorker {
  id: number;
  status: 'running' | 'free' | 'paused' | 'dead';
  worker: Worker;
  channel: MessageChannel,
  isFixedJob?: boolean;
}

export interface Job<T = any> {
  status: 'pending' | 'executing';
  readonly id: string;
  payload: {
    executable: (... parms: any[]) => T,
    data: any
  }
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void

}

export interface IWorkerPoll {
  execute(executable: (... parms: any[]) => any, data: any): void;

  terminate(): Promise<number[]>;

  pauseAll(): Promise<any>;
}
