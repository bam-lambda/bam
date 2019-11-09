![BAM! header](https://i.imgur.com/LVkFZHW.png)
[![bam 💥](https://img.shields.io/badge/bam-💥-green.svg)](https://bam-lambda.com)
[![npm](https://img.shields.io/npm/v/bam-lambda.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/bam-lambda)
[![license](https://img.shields.io/npm/l/bam-lambda.svg)](https://www.npmjs.com/package/bam-lambda)

**BAM!** is a serverless framework that makes it quick (hence, the name) and easy to get small applications up & running using Node.js and Amazon Web Services (AWS). It is optimized for the deployment of AWS Lambda functions integrated with Amazon API Gateway endpoints, but also allows for the creation of Amazon DynamoDB tables, which can help persist data between lambda invocations.

As long as you meet the prerequisites (see below), there is no need to perform any configuration; BAM! presumes some configuration details by default and uses [AWS STS](https://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html) to pull in your account number.  That said, there is an option to update your default configuration if you'd like to do that.

Assuming you've written a JavaScript file according to the [AWS Lambda programming pattern for Node.js](https://docs.aws.amazon.com/lambda/latest/dg/programming-model.html), only one command is needed to push it to AWS and integrate it with an API Gateway endpoint.

<img src="https://i.imgur.com/TjAC3Gg.gif" data-canonical-src="https://i.imgur.com/TjAC3Gg.gif" width="400" alt="bam deploy" />

If you're new to AWS Lambda, we've included templates for common scenarios (see documentation for `bam create` in the command section below). These will help you handle requests made using a variety of HTTP methods and expose query/path parameters.

For those more familiar with AWS, we did our best to structure BAM! to allow you to work with existing lambdas & make changes to resources using the AWS console (or other frameworks).

Thanks for trying out BAM!  We hope you'll like it! 💥

## The Team
**Takayoshi Sampson** *Software Engineer* New York, NY

**[Jocie Moore](http://www.jociemoore.com)** *Software Engineer* San Francisco, CA

**[Jason Overby](http://www.jasonoverby.com)** *Software Engineer* Portland, OR

## Getting Started

### Prerequisites
* AWS account
* AWS CLI
* Node.js >= 10
* NPM

BAM! requires that you have an account with AWS and you have set up an AWS CLI configuration on your local machine.  If you have not already done so, please visit [Configuring the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) for instructions.  BAM! will use the default profile and region you have specified within that profile when interacting with AWS services.


### Install BAM!
``` bash
npm install -g bam-lambda
```
---

## Commands

BAM! commands conform to the following structure:
```
bam <commandName> [<name>] [--<flag>]
```

For all commands, BAM! will look for `<name>` in your current directory.  This can be either a file called `<name>.js` or a directory called `<name>` containing a file called `<name>.js`.

---

#### `bam config`
*updates default settings*

---

#### `bam create <name>`
*creates local file (or directory) based on template*

*`--invoker`*: creates a local file/directory with lambda templated to invoke another lambda
*`--html`*: creates local directory containing index.html, application.js, main.css, and [resourceName].js
*`--db`*: creates local file/directory templated to work with a DynamoDB table
*`--verbose`*: creates template with instructional comments

---

#### `bam deploy <name>`
*deploys lambda + endpoint*

*`--role`*: specifies role for this deployment
*`--permitDb`*: adds policy with scan, put, get, delete DynamoDB permissions
*`--methods`*: specifies HTTP method(s) for the endpoint
*`--lambdaOnly`*: deploys the lambda without an endpoint

---

#### `bam redeploy <name>`
*updates existing lambda and endpoint*

*`--role`*: specifies role for this deployment
*`--permitDb`*: adds policy with scan, put, get, delete DynamoDB permissions
*`--methods`*: specifies HTTP method(s) for the endpoint
*`--rmMethods`*: specifies a HTTP method or methods to remove from endpoint
*`--addEndpoint`*: connects endpoint to lambda
*`--revokeDb`*: changes role associated with lambda to role specified in user config
*`--runtime`*: changes Node runtime of the lambda
---

#### `bam delete <name>`
*deletes existing lambda + endpoint*

*`--dbtable`*: deletes DynamoDB table
*`--endpointOnly`*: deletes endpoint only

---

#### `bam get <name>`
  *pulls lambda code from AWS into a local directory*

---

#### `bam list`
*lists lambdas, endpoints, and dbtables*

```
Lambdas and endpoints deployed from this machine using BAM!:
  nameOfLambda1
    description: a description of the lambda
    endpoint: http://associatedEndpoint/bam
    http methods: GET

  nameOfLambda2
    description: a description of the lambda
    endpoint:: http://associatedEndpoint/bam
    http methods: GET, POST, DELETE

Other lambdas on AWS
  anotherLambda
  yetAnotherLambda

DynamoDB tables deployed from this machine using BAM!:
  nameOfTable1
    partition key: id (number)

  nameOfTable2
    partition key: id (number)
    sort key: name (string)
```

*`--dbtables`*: lists only DynamoDB tables created with BAM!
*`--lambdas`*: lists only lambdas and associated endpoints

---

#### `bam dbtable <name>`
*creates a DynamoDB table `[tableName]` on AWS*

---

#### `bam --man|help|h`
*documentation of commands*

*`--<commandName>`*: logs a description of the command options
*`--all`*: logs descriptions of all command options

---

#### `bam --version|v`
*displays version*

---------------

## Additional Resources
* [AWS Console](https://aws.amazon.com/console/)
* [AWS CLI](https://aws.amazon.com/cli/)
* [What is AWS Lambda?](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
* [What is Amazon API Gateway?](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
* [What is Amazon DynamoDB?](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
* [AWS Lambda SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html)
* [Amazon API Gateway SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html)
* [Amazon DynamoDB Document Client SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
