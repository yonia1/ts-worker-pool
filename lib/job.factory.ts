import { v4 as uuidv4 } from 'uuid';
import { Job } from './types';

export class JobFactory {
  /// static reuseJobs: Job[] = [];
  static createJob<T>(payload?: any, resolve?: (value?: T | PromiseLike<T>) => void, reject?: (reason?: any) => void): Job<T> {

    return {
      id: uuidv4(),
      status: 'pending',
      payload,
      resolve: resolve as any,
      reject: reject as any,

    }
  }
}
