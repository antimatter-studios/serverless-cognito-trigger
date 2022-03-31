# Serverless plugin for Configuring AWS Cognito lambda triggers

Sometimes it's useful whilst developing applications using the [Serverless framework](https://serverless.com) to be 
able to use bind a lambda function to an AWS Cognito event trigger. For doing things like migrations, pre token generation,
etc, etc.

The default serverless framework has a way to setup a Cognito event trigger, the problem is that it requires a custom
lambda to setup the trigger because of a limitation of how CloudFormation works. This custom lambda isn't configurable
and in testing doesn't conform to the other lambda configurations, or allow you to specify it. So you have this normal
cognito setup, then you have this out of place lambda setup which you also have to give permissions to if you're running
in a restricted deployment role.

This plugin allows you to attach an event to a lambda which will attach a cognito event to it. It's very simple and works
in the post deploy stage after all the lambdas and other configurations from your serverless application have been deployed
and uses the aws provider to call the javascript sdk to add the triggers

## Usage
On a lambda which you want to use as a Cognito trigger, add configuration like this
```yaml
functions:
  aws_cognito_pre_signup_trigger:
    name: aws-cognito-pre-signup-trigger
    handler: handler.function
    events:
      - cognitoTrigger:
          poolId: eu-west-1_ab4j38fh49
          trigger: PreSignUp
```
