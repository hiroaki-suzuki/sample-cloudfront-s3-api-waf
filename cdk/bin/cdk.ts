#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvValues } from '../lib/types/env-values';
import { ApiDeployStack } from '../lib/api-deploy-stack';
import { WafStack } from '../lib/waf-stack';
import { InfraStack } from '../lib/infra-stack';
import { FrontDeployStack } from '../lib/front-deploy-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName');
const envKey = app.node.tryGetContext('environment');
const envValues: EnvValues = app.node.tryGetContext(envKey);
const namePrefix = `${projectName}-${envValues.env}`;

// APIのデプロイ用のスタックの作成
const apiDeployStack = new ApiDeployStack(app, `${namePrefix}-api-deploy`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  namePrefix,
  envValues,
});

// WAFのスタックの作成
const wafStack = new WafStack(app, `${namePrefix}-waf`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  namePrefix,
  envValues,
});

// インフラのスタックの作成
const infraStack = new InfraStack(app, `${namePrefix}-infra`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  crossRegionReferences: true,
  namePrefix,
  envValues,
  webAclArn: wafStack.webAclArn,
  restApi: apiDeployStack.restApi,
  restApiDomain: apiDeployStack.restApiDomain,
});
infraStack.addDependency(wafStack);
infraStack.addDependency(apiDeployStack);

// フロントエンドのデプロイ用のスタックの作成
const frontDeployStack = new FrontDeployStack(app, `${namePrefix}-front-deploy`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  crossRegionReferences: true,
  namePrefix,
  envValues,
  frontSourceBucket: infraStack.frontSourceBucket,
  distribution: infraStack.distribution,
});
frontDeployStack.addDependency(infraStack);
