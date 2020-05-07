import { WorkerPoll } from '../dist/index';

function parseHrtimeToSeconds(hrtime: any) {
  const seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
  return seconds;
}

describe('it should be able to execute tasks ',()=>{

  let taskRunner = new WorkerPoll(2);
  afterAll(async ()=>{
    await taskRunner.terminate();
  })
  test('It should run a regular task', async () => {
    // expect.assertions(1);
    const res = await taskRunner.execute(()=> 3 + 3);
    expect(res).toBe(6);
  });

  test('it should handle functions with 1 param',async ()=>{
    const res = await taskRunner.execute((x)=> x +3, 3);
    expect(res).toBe(6);
  });
  test('it should handle functions with more then 1 param',async ()=>{
    const res = await taskRunner.execute((x,y)=> x + y, 3,3);
    expect(res).toBe(6);
  });
  test('it should handle function with its own imports', async ()=>{
    const fs = await import ('fs');
    const path = await import('path');
    const file = path.join(process.cwd(),'tests','test.spec.ts');
    const res = fs.existsSync(file);
    expect(res).toBe(true);

  });

  test('it should run more then 1 job',async ()=>{
    jest.setTimeout(1000*60);
    const task1 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task2 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task3 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const resArray = await Promise.all([task1, task2,task3]);
    const res = resArray.reduce((previousValue, currentValue) => previousValue+ currentValue, 0);
    expect(res).toBe(18);
  });
  test('it should run more tasks then the thread pull can handle',async ()=>{
    jest.setTimeout(1000*60);
    const task1 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task2 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task3 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task4 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const task5 =  taskRunner.execute((x,y)=> x + y, 3,3);
    const resArray = await Promise.all([task1, task2,task3,task4,task5]);
    const res = resArray.reduce((previousValue, currentValue) => previousValue+ currentValue, 0);
    expect(res).toBe(resArray.length * 6);
  });
  test('it should be able to run recursive functions',async ()=>{
    jest.setTimeout(1000*60);
    const fib = (n: number): number=> n > 1 ? fib(n-1) + fib(n-2) : 1;
    const res = await taskRunner.execute(fib, 10);
    expect(res).toBe(89);
  })

  test('it should finish multi heavy computational tasks faster',async ()=>{
    const runFib2 = 30;
    jest.setTimeout(1000*60 * 15);
    const fib = (n: number): number=> n > 1 ? fib(n-1) + fib(n-2) : 1;
    let startTime = process.hrtime();
    const res1 = fib(runFib2);
    const res2= fib(runFib2);
    const elapsedSecondsRegualr = parseHrtimeToSeconds(process.hrtime(startTime));
    console.log('regular fib run at ',elapsedSecondsRegualr);
    const startTimenext = process.hrtime();

    const task1 =  taskRunner.execute(fib, runFib2);
    const task2 =  taskRunner.execute(fib, runFib2);
    const resArray = await Promise.all([task1, task2]);
    const elapsedSecondsRunner = parseHrtimeToSeconds(process.hrtime(startTimenext));
    const resRunner = resArray.reduce((previousValue, currentValue) => previousValue+ currentValue, 0);
    console.log('multi fib run at ',elapsedSecondsRunner);
    expect(resRunner).toBe(res1+res2);
    expect(Number.parseFloat(elapsedSecondsRunner)).toBeLessThan(Number.parseFloat(elapsedSecondsRegualr))
  })

})

