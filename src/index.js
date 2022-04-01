'use strict';

class ServerlessPlugin {
    constructor(serverless, opts) {
        this._serverless = serverless;
        this._opts = opts;
        this._provider = null

        if(this._serverless){
            this._provider = this._serverless.getProvider('aws');

            this._serverless.configSchemaHandler.defineFunctionEvent('providerName', 'cognitoTrigger', {
                type: 'object',
                properties: {
                    poolId: { type: 'string' },
                    trigger: { type: 'string' },
                },
                required: ['poolId', 'trigger'],
            });
        }

        if(this._provider){
            this.hooks = {
                'deploy:deploy': () => this.process(this.attachLambda.bind(this)),
                'before:remove:remove': () => this.process(this.detachLambda.bind(this)),
            }
        }else{
            this._serverless.cli.log('aws provider not found, serverless-cognito-trigger is for aws services only');
        }
    }

    async process(callback) {
        for(const config of Object.values(this._serverless.service.functions)){
            for(const event of Object.values(config.events)){
                if(event.cognitoTrigger){
                    const userPool = await this.describePool(event.cognitoTrigger.poolId);

                    userPool.LambdaConfig = callback(
                        userPool.LambdaConfig,
                        event.cognitoTrigger.trigger,
                        await this.getFunctionArn(config.name),
                    );

                    await this.updatePool(userPool);
                }
            }
        }
    }

    async describePool(userPoolId) {
        const result = await this._provider.request(
            'CognitoIdentityServiceProvider',
            'describeUserPool',
            { UserPoolId: userPoolId }
        );

        const userPool = result.UserPool;

        // set this field because it's required when updating a user pool
        userPool.UserPoolId = userPoolId;

        // delete all these fields because you can't update a user pool with these attributes
        delete userPool.Id;
        delete userPool.SchemaAttributes;
        delete userPool.Name;
        delete userPool.LastModifiedDate;
        delete userPool.CreationDate;
        delete userPool.EstimatedNumberOfUsers;
        delete userPool.Arn;
        delete userPool.AdminCreateUserConfig.UnusedAccountValidityDays;

        // return the resulting object that can be used to update
        return userPool;
    }

    async updatePool(userPool) {
        return await this._provider.request(
            'CognitoIdentityServiceProvider',
            'updateUserPool',
            userPool
        );
    }

    attachLambda(lambdaConfig, trigger, arn) {
        lambdaConfig[trigger] = arn;
        return lambdaConfig;
    }

    detachLambda(lambdaConfig, trigger) {
        delete lambdaConfig[trigger];
        return lambdaConfig;
    }

    async getFunctionArn(name) {
        const result = await this._provider.request(
            'Lambda',
            'getFunction',
            {FunctionName: name}
        );

        return result.Configuration.FunctionArn;
    }
}

module.exports = ServerlessPlugin;
