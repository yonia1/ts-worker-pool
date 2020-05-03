const {parentPort, MessageChannel} = require('worker_threads');
const {serialize, deserialize} = require('surrial');

(function () {
    const self = this;
    let status = 'running'
    let isFixJob = false;
    let fixedJob = null;

    const handleFunctionRequest = function (executable) {
        const runnableFunctionName = executable.fName;
        const runnableFunction = deserialize(executable.f);
        const isAnonymous = runnableFunctionName && runnableFunctionName !== ''
            && runnableFunctionName !== 'anonymous'
        if (isAnonymous) {
            self[runnableFunctionName] = runnableFunction;
        }
        return {runnableFunctionName, runnableFunction, isAnonymous};
    };
    parentPort.on('message', async ({action, id, payload: {port, executable, data, rawData}}) => {
        if (action === 'setFixedJob') {
            isFixJob = true;
            fixedJob = handleFunctionRequest(executable).runnableFunction;

        }
        if (action === 'pause') {
            // todo(handle resuamble )
        }
        if (action === 'die') {
            this.terminate();
        }

        if (action === 'execute') {
            if (status !== 'running') {
                parentPort.postMessage({
                    id,
                    status: 'error',
                    result: 'worker is not available'
                });
                return;
            }
            let invokeParamters;
            if (data && data !== undefined && data !== 'undefined')
                invokeParamters = (data instanceof SharedArrayBuffer ? data : Object.assign(deserialize(data), rawData));
            const {runnableFunctionName, runnableFunction, isAnonymous} = isFixJob ? fixedJob : handleFunctionRequest(executable);
            try {
                // Invoke the function without a context
                status = 'executing';
                const result = await runnableFunction(...invokeParamters);
                parentPort.postMessage({
                    data: {
                        id,
                        status: 'success',
                        result: serialize(result)
                    }
                });
                if (isAnonymous) delete self[runnableFunctionName];
            } catch (e) {
                parentPort.postMessage({
                    data: {
                        id,
                        status: 'error',
                        result: serialize(e)
                    }
                });

            }

            status = 'running';
        }
    });
})();
