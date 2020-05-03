ts worker pull

A typescript lib for NODE for running multiply computational job in parlle with
without blocking the main event loop thread 

repo
https://github.com/yonia1/ts-worker-poll

install 

```
    npm install ts-worker-poll 
    
    yarn add ts-worker-poll
```
Import the worker pull object and init it with the number of workers

```$xslt
    import { WorkerPoll } from 'ts-worker-pool';
    
    const taskRunner = new WorkerPoll(2);
```

Running a task:

```javascript
    const fib = (n)=> n > 1 ? fib(n-1) + fib(n-2) : 1;
    const res = await taskRunner.execute(fib, 10);
```

An execution of a task will return a promise which will be resolved as the task runner
finished the task

First argument is the function you would like to run
Seconed argument is the parameters the function requires you can just add them one by one

```javascript
    const res = await taskRunner.execute((x,y)=> x + y, 3,3);
```

If you need imports only for your task no problem load them inside the task

```javascript
    const fs = await import ('fs');
    const path = await import('path');
    const file = path.join(process.cwd(),'tests','test.spec.ts');
    const res = fs.existsSync(file);
```

Running multiple tasks concurrently:

```javascript
    const task1 =  taskRunner.execute(fib, 40);
    const task2 =  taskRunner.execute(fib, 40);
    const resArray = await Promise.all([task1, task2]);
```

As each task return a promise run them in parrle using Promise.all
