class AutoTester {
    constructor({client1, client2, server}) {
        if (!client1) throw new Error('"client1" required');
        if (!client2) throw new Error('"client2" required');
        if (!server) throw new Error('"server" required');

        this.client1 = client1;
        this.client2 = client2;
        this.server  = server;
    }

    async runAllTests() {
        await this._exposeServerMethods();
        await this._runPositiveTestsForClient(this.client1);
        await this._runPositiveTestsForClient(this.client2);

        await this._runNegativeTestsForClient(this.client1);
        await this._runNegativeTestsForClient(this.client2);
    }

    async _exposeServerMethods() {
        this.server.expose({
            syncMethodPrimitiveData: (arg1, arg2) => {
                return `args data "${arg1} ${arg2}" from syncMethodPrimitiveData`
            },

            syncMethodComplexData: (...args) => {
                return {
                    from: 'syncMethodComplexData',
                    args
                }
            },

            asyncMethodPrimitiveData: async (arg1, arg2) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(`args data "${arg1} ${arg2}" from asyncMethodPrimitiveData`);
                    }, 500);
                });
            },

            asyncMethodComplexData: async (...args) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve({
                            from: 'syncMethodComplexData',
                            args
                        });
                    }, 500);
                });
            }
        });
    }

    async _runPositiveTestsForClient(client) {
        const testData = [
            {
                callMethod: 'syncMethodPrimitiveData',
                args: ['arg1', 123],
                expectedResult: 'args data "arg1 123" from syncMethodPrimitiveData'
            },
            {
                callMethod: 'syncMethodComplexData',
                args: ['arg1', 123],
                expectedResult: {from: 'syncMethodComplexData', args: ['arg1', 123] }
            },
            {
                callMethod: 'asyncMethodPrimitiveData',
                args: ['arg1', 123],
                expectedResult: 'args data "arg1 123" from asyncMethodPrimitiveData'
            },
            {
                callMethod: 'asyncMethodComplexData',
                args: ['arg1', 123],
                expectedResult: {from: 'asyncMethodComplexData', args: ['arg1', 123] }
            },
        ];

        for (const {callMethod, args, expectedResult} of testData) {
            const gotResult = await client.callMethod(callMethod, ...args);
            console.log(expectedResult, gotResult)
        }
    }

    async _runNegativeTestsForClient(client) {
        const testData = [
            {
                callMethod: 'notExistingMethod',
                args: ['arg1', 123],
                expectedResult: 'args data "arg1 123" from syncMethodPrimitiveData'
            },
        ];

        for (const {callMethod, args, expectedResult} of testData) {
            try {
                await client.callMethod(callMethod, ...args);
            } catch (gotError) {
                const expectedError = 'Method not found';
                console.log(expectedError, gotError.message); // TODO assert 
            }
        }
    }
}

module.exports = AutoTester;