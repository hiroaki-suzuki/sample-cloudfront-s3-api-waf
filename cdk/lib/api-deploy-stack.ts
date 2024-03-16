import * as cdk from 'aws-cdk-lib';
import { EnvValues } from './types/env-values';
import { Construct } from 'constructs';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ApiDeploy } from './api/api-deploy';
import { Api } from './api/api';

interface ApiDeployStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class ApiDeployStack extends cdk.Stack {
  public readonly restApi: IRestApi;
  public readonly restApiDomain: string;

  constructor(scope: Construct, id: string, props: ApiDeployStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues } = props;

    // API Gatewayを作成
    const api = new Api(this, 'Api', {
      namePrefix,
      envValues,
    });

    // デプロイ
    new ApiDeploy(this, 'ApiDeploy', {
      namePrefix,
      restApi: api.restApi,
      restApiLambdaRole: api.lambdaRole,
    });

    this.restApi = api.restApi;
    this.restApiDomain = `${api.restApi.restApiId}.execute-api.${this.region}.${this.urlSuffix}`;
  }
}
