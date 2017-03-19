const fs = require('fs');
const Generator = require('yeoman-generator');

const buildPolicy = (project, stage, region) => {
  return `
    {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:Describe*",
                "cloudformation:List*",
                "cloudformation:Get*",
                "cloudformation:PreviewStackUpdate"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:DeleteStack"
            ],
            "Resource": "arn:aws:cloudformation:*:*:stack/${project}-${stage}-${region}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:Get*",
                "lambda:List*",
                "lambda:CreateFunction"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${project}-*-serverlessdeploymentbucket-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject",
                "s3:DeleteBucket",
                "s3:ListBucketVersions"
            ],
            "Resource": [
                "arn:aws:s3:::${project}-*-serverlessdeploymentbucket-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:AddPermission",
                "lambda:CreateAlias",
                "lambda:DeleteFunction",
                "lambda:InvokeFunction",
                "lambda:PublishVersion",
                "lambda:RemovePermission",
                "lambda:Update*"
            ],
            "Resource": "arn:aws:lambda:*:*:function:${project}-${stage}-${region}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:GET"
            ],
            "Resource": [
                "arn:aws:apigateway:*::/restapis"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:GET",
                "apigateway:POST",
                "apigateway:PUT",
                "apigateway:DELETE"
            ],
            "Resource": [
                "arn:aws:apigateway:*::/restapis/*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": "arn:aws:iam::*:role/*"
        },
        {
            "Effect": "Allow",
            "Action": "kinesis:*",
            "Resource": "arn:aws:kinesis:*:*:stream/${project}-${stage}-${region}"
        },
        {
            "Effect": "Allow",
            "Action": "iam:*",
            "Resource": "arn:aws:iam::*:role/${project}-${stage}-${region}"
        },
        {
            "Effect": "Allow",
            "Action": "sqs:*",
            "Resource": "arn:aws:sqs:*:*:${project}-${stage}-${region}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "events:Put*",
                "events:Remove*",
                "events:Delete*"
            ],
            "Resource": "arn:aws:events:*:*:rule/${project}-${stage}-${region}"
        }
    ]
}
    `;
};

const escapeValFilename = function(val) {
  return (val === '*') ? '_star_' : val;
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
    return this.prompt([{
      type    : 'input',
      name    : 'name',
      message : 'Your Serverless service name',
      default : this.appname // Default to current folder name
    }, {
      type    : 'input',
      name    : 'stage',
      message : 'You can specify a specific stage, if you like:',
      default : '*'
    }, {
      type    : 'input',
      name    : 'region',
      message : 'You can specify a specific region, if you like:',
      default : '*'
    }]).then((answers) => {
      this.slsSettings = {
        name: answers.name,
        stage: answers.stage,
        region: answers.region
      };
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

    const policyString = buildPolicy(project, stage, region);
    const fileName = `${project}-${escapeValFilename(stage)}-${escapeValFilename(region)}-policy.json`;

    this.log(`Writing to ${fileName}`);
    fs.writeFile(fileName, policyString, done);

  }


};