'use strict';
const fs = require('fs');
const Generator = require('yeoman-generator');

const buildPolicy = ({ name, account, stage, region }) => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudformation:List*',
          'cloudformation:Get*',
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
          `arn:aws:cloudformation:${region}:${account}:stack/${name}-${stage}/*`
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
          "s3:GetBucketLocation",
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:ListBucket",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
<<<<<<< HEAD
          "s3:DeleteBucketPolicy",
=======
>>>>>>> 4b3f788... Added Account filter and updated s3 bucket policies
          "s3:ListBucketVersions",
          "s3:PutAccelerateConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:PutEncryptionConfiguration"
        ],
        Resource: [`arn:aws:s3:::${name}*serverlessdeploy*`]
      },
      {
        Effect: 'Allow',
        Action: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        Resource: [`arn:aws:s3:::${name}*serverlessdeploy*`]
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
          `arn:aws:lambda:${region}:${account}:function:${name}-${stage}-*`
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'apigateway:GET',
          'apigateway:POST',
          'apigateway:PUT',
          'apigateway:DELETE',
          "apigateway:PATCH"
        ],
        Resource: [
          'arn:aws:apigateway:*::/restapis*',
          'arn:aws:apigateway:*::/apikeys*',
          'arn:aws:apigateway:*::/usageplans*'
        ]
      },
      {
        Effect: 'Allow',
        Action: ['iam:PassRole'],
        Resource: [`arn:aws:iam::${account}:role/*`]
      },
      {
        Effect: 'Allow',
        Action: 'kinesis:*',
        Resource: [
          `arn:aws:kinesis:*:*:stream/${name}-${stage}-${region}`
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:GetRole',
          'iam:CreateRole',
          'iam:PutRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:DeleteRole'
        ],
        Resource: [
          `arn:aws:iam::${account}:role/${name}-${stage}-${region}-lambdaRole`
        ]
      },
      {
        Effect: 'Allow',
        Action: 'sqs:*',
        Resource: [`arn:aws:sqs:*:${account}:${name}-${stage}-${region}`]
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
        Resource: [`arn:aws:logs:${region}:${account}:*`],
        Effect: 'Allow'
      },
      {
        Action: ['logs:PutLogEvents'],
        Resource: [`arn:aws:logs:${region}:${account}:*`],
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
        Resource: [`arn:aws:events:${region}:${account}:rule/${name}-${stage}-${region}`]
      },
      {
        Effect: 'Allow',
        Action: ['events:DescribeRule'],
        Resource: [`arn:aws:events:${region}:${account}:rule/${name}-${stage}-*`]
      }
    ]
  };
};

const escapeValFilename = function (val) {
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
        name: 'account',
<<<<<<< HEAD
        message: 'Your AWS account ID',
=======
        message: 'Your AWS account name',
>>>>>>> 4b3f788... Added Account filter and updated s3 bucket policies
        default: '*'
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
      this.log('account number', answers.account);
      this.log('app stage', answers.stage);
      this.log('app region', answers.region);
    });
  }

  writing() {
    const done = this.async();

    const { name: project, account, stage, region } = this.slsSettings;

    const policy = buildPolicy(this.slsSettings);
    if (this.slsSettings.dynamodb) {
      policy.Statement.push({
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: [`arn:aws:dynamodb:*:${account}:table/*`]
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
    const accountName = account === '*' ? '' : `${account}-`;
    const fileName = `${accountName}${project}-${escapeValFilename(stage)}-${escapeValFilename(region)}-policy.json`;

    this.log(`Writing to ${fileName}`);
    fs.writeFile(fileName, policyString, done);
  }
};
