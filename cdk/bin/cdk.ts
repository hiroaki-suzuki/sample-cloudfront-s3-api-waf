#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvValues } from '../lib/types/env-values';
import { ApiDeployStack } from '../lib/api-deploy-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName');
const envKey = app.node.tryGetContext('environment');
const envValues: EnvValues = app.node.tryGetContext(envKey);
const namePrefix = `${projectName}-${envValues.env}`;

// APIのデプロイ用のスタックの作成
new ApiDeployStack(app, `${namePrefix}-api-deploy`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  namePrefix,
  envValues,
});
