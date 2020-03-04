# Serverless Policy Generator

This is a yeoman generator for creating the AWS Policy document that
allows a user to deploy a Serverless service.

Simply run it and provide it with the name of the service and, optionally,
the name of the stage and region for deployment (in case you want to limit the user
in question).

A `${project}-${stage}-${region}-policy.json` file will be created (using `_star_` instead of `*`
in the filename). If an Account ID is provided, the file will be named as `${account}-${project}-${stage}-${region}-policy.json`.
The contents of this can then be used to create a policy in your IAM dashboard.

## Acknowledgements

The basic Policy Document is taken from https://github.com/serverless/serverless/issues/1439#issuecomment-268434517
