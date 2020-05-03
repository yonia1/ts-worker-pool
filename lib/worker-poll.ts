// @ts-ignore
import { MessageChannel, Worker } from 'worker_threads';
import { serialize, deserialize } from 'surrial';
import { JobFactory } from './job.factory';
import { IWorkerPollWorker, Job, IWorkerPoll } from './types';


export class WorkerPoll implements IWorkerPoll {

  private fixedWorkers: IWorkerPollWorker[] = [];
  private pendingJobs: Job[] = [];
  private isFixedWorker = false;
  constructor(readonly workersCount: number, fixedWorkFunction?: (... parms: any[]) => any) {

    while (workersCount--) {
      const worker: IWorkerPollWorker = {
        id: this.workersCount -workersCount,
        status: 'free',
        worker: new Worker('./lib/worker.js'),
        channel: new MessageChannel() as MessageChannel,
        isFixedJob: false
      };
      if(fixedWorkFunction){
        this.isFixedWorker = true;
        worker.isFixedJob = true;
        const fName = fixedWorkFunction.name;
        worker.worker.postMessage({
          action: 'setFixedJob',
          payload: { executable: {fName,fixedWorkFunction}},
        })
      }

      worker.worker.on('message', ((ev: MessageEvent): void => {
        this.handleWorkerResult(ev, worker);
      }));

      this.fixedWorkers.push(worker as IWorkerPollWorker);

    }

  }

  private handleWorkerResult(ev: MessageEvent, worker: IWorkerPollWorker) {
    const { status, result, id } = ev.data;
    const idx: number = this.pendingJobs.findIndex((j) => j.id === id);
    const job: Job = this.pendingJobs[idx];
    worker.status = 'free';
    if (!job) return;

    status === 'success' ? job.resolve(deserialize(result)): job.reject(deserialize(result));
    const finishedJob = this.pendingJobs.splice(idx,1);
    this.executeNextJobInQueue();
  }

  execute(executable: (...parms: any[]) => any, ...data: any[] ): Promise<any> | null {

    if (!executable &&  !this.isFixedWorker) return null;

    const job: Job = JobFactory.createJob({
      executable,
      data,
    });

    this.moveJobToRunners(job);

    const PromiseRes = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });
    this.pendingJobs.push(job);
    return PromiseRes;
  }

  async pauseAll():Promise<any> {
    return null;
  }

  terminate(): Promise<number[]> {
    return Promise.all(this.fixedWorkers.map(worker =>worker.worker.terminate()));

  }


  private getFreeThread() {
    return this.fixedWorkers.find((t) => t.status === 'free');
  }
  private getNextPendingJob(): Job | undefined{
    return this.pendingJobs.find((job:Job)=>job.status ==='pending');
  }

  private executeNextJobInQueue() {
    if (this.pendingJobs.length === 0) return;

    const nextJob: Job | undefined = this.getNextPendingJob();
    if(nextJob) this.moveJobToRunners(nextJob)

  }

  private moveJobToRunners(job: Job) {
    if(!job) return;
    const freeThread = this.getFreeThread(); // no free  thread - then once a thread has submitted a result it will fire again
    if (!freeThread) return;
    const fName = (job.payload.executable.name)
    const f = serialize(job.payload.executable);
    const d = serialize(job.payload.data);
    freeThread.worker.postMessage({
      action: 'execute',
      id: job.id,
      payload: { executable: {fName,f}, data: d },
    });
    freeThread.status = 'running';
    job.status = 'executing';
  }

}
