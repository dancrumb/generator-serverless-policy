'use strict';
const fs = require('fs');
const Generator = require('yeoman-generator');

const buildPolicy = (serviceName, stage, region) => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudformation:List*',
          'cloudformation:Get*',
          'cloudformation:PreviewStackUpdate',
          'cloudformation:ValidateTemplate'
        ],
        Resource: ['*']
      },
      {
        Effect: 'Allow',
        Action: [
          "cloudformation:CreateStack",
          "cloudformation:CreateUploadBucket",
          "cloudformation:DeleteStack",
          "cloudformation:Describe*",
          "cloudformation:UpdateStack"
        ],
        Resource: [
          `arn:aws:cloudformation:${region}:*:stack/${serviceName}-${stage}/*`
        ]
      },
      {
        Effect: 'Allow',
        Action: ['lambda:Get*', 'lambda:List*', 'lambda:CreateFunction'],
        Resource: ['*']
      },
      {
        Effect: 'Allow',
        Action: [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:ListBucket",
          "s3:ListBucketVersions"
        ],
        Resource: [`arn:aws:s3:::${serviceName}*serverlessdeploy*`]
      },
      {
        Effect: 'Allow',
        Action: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        Resource: [`arn:aws:s3:::${serviceName}*serverlessdeploy*`]
      },
      {
        Effect: 'Allow',
        Action: [
          'lambda:AddPermission',
          'lambda:CreateAlias',
          'lambda:DeleteFunction',
          'lambda:InvokeFunction',
          'lambda:PublishVersion',
          'lambda:RemovePermission',
          'lambda:Update*'
        ],
        Resource: [
          `arn:aws:lambda:${region}:*:function:${serviceName}-${stage}-*`
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'apigateway:GET',
          'apigateway:POST',
          'apigateway:PUT',
          'apigateway:DELETE'
        ],
        Resource: [
          'arn:aws:apigateway:*::/restapis*'
        ]
      },
      {
        Effect: 'Allow',
        Action: ['iam:PassRole'],
        Resource: ['arn:aws:iam::*:role/*']
      },
      {
        Effect: 'Allow',
        Action: 'kinesis:*',
        Resource: [
          `arn:aws:kinesis:*:*:stream/${serviceName}-${stage}-${region}`
        ]
      },
      {
        Effect: 'Allow',
        Action: 'iam:*',
        Resource: [
          `arn:aws:iam::*:role/${serviceName}-${stage}-${region}-lambdaRole`
        ]
      },
      {
        Effect: 'Allow',
        Action: 'sqs:*',
        Resource: [`arn:aws:sqs:*:*:${serviceName}-${stage}-${region}`]
      },
      {
        Effect: 'Allow',
        Action: ['cloudwatch:GetMetricStatistics'],
        Resource: ['*']
      },
      {
        Action: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:DeleteLogGroup'
        ],
        Resource: [`arn:aws:logs:${region}:*:*`],
        Effect: 'Allow'
      },
      {
        Action: ['logs:PutLogEvents'],
        Resource: [`arn:aws:logs:${region}:*:*`],
        Effect: 'Allow'
      },
      {
        Effect: 'Allow',
        Action: [
          'logs:DescribeLogStreams',
          'logs:DescribeLogGroups',
          'logs:FilterLogEvents'
        ],
        Resource: ['*']
      },
      {
        Effect: 'Allow',
        Action: ['events:Put*', 'events:Remove*', 'events:Delete*'],
        Resource: [`arn:aws:events:*:*:rule/${serviceName}-${stage}-${region}`]
      }
    ]
  };
};

const escapeValFilename = function(val) {
  return val === '*' ? '_star_' : val;
};

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('project', {
      description: 'The name of the Serverless project',
      type: String
    });
    this.option('stage', {
      description: 'The name of a single stage to target',
      type: String,
      default: '*'
    });
    this.option('region', {
      description: 'The name of a single region to target',
      type: String,
      default: '*'
    });
  }

  prompting() {
    return this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Your Serverless service name',
        default: this.appname // Default to current folder name
      },
      {
        type: 'input',
        name: 'stage',
        message: 'You can specify a specific stage, if you like:',
        default: '*'
      },
      {
        type: 'input',
        name: 'region',
        message: 'You can specify a specific region, if you like:',
        default: '*'
      },
      {
        type: 'confirm',
        name: 'dynamodb',
        message: 'Does your service rely on DynamoDB?'
      },
      {
        type: 'confirm',
        name: 's3',
        message: 'Is your service going to be using S3 buckets?'
      }
    ]).then(answers => {
      this.slsSettings = answers;
      this.log('app name', answers.name);
      this.log('app stage', answers.stage);
      this.log('app region', answers.region);
    });
  }

  writing() {
    const done = this.async();

    const project = this.slsSettings.name;
    const stage = this.slsSettings.stage;
    const region = this.slsSettings.region;

    const policy = buildPolicy(project, stage, region);
    if (this.slsSettings.dynamodb) {
      policy.Statement.push({
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: ['arn:aws:dynamodb:*:*:table/*']
      });
    }

    if (this.slsSettings.s3) {
      policy.Statement.push({
        Effect: 'Allow',
        Action: ['s3:CreateBucket'],
        Resource: [`arn:aws:s3:::*`]
      });
    }

    const policyString = JSON.stringify(policy, null, 2);
    const fileName = `${project}-${escapeValFilename(stage)}-${escapeValFilename(region)}-policy.json`;

    this.log(`Writing to ${fileName}`);
    fs.writeFile(fileName, policyString, done);
  }
};
