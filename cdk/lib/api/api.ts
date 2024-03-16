import { Construct } from 'constructs';
import {
  AnyPrincipal,
  Effect,
  IRole,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import {
  AccessLogFormat,
  Cors,
  IRestApi,
  LogGroupLogDestination,
  MethodLoggingLevel,
  ResponseType,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { BaseLogGroup } from '../base/base-log-group';
import { EnvValues } from '../types/env-values';

interface ApiProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class Api extends Construct {
  public readonly restApi: IRestApi;
  public readonly lambdaRole: IRole;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { namePrefix, envValues } = props;

    // API Gatewayの作成
    this.restApi = this.createRestApi(namePrefix, envValues.apiRefererId);

    // Lambdaのロールの作成
    this.lambdaRole = this.createLambdaRole(namePrefix);
  }

  private createRestApi(namePrefix: string, apiRefererId: string): IRestApi {
    const logGroup = new BaseLogGroup(this, 'ApiAccessLog', {
      logGroupName: `/aws/apigateway/${namePrefix}-api-access-log`,
    });

    const restApi = new RestApi(this, 'Api', {
      restApiName: `${namePrefix}-api`,
      description: `${namePrefix} API`,
      deployOptions: {
        stageName: 'api',
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.clf(),
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      cloudWatchRole: true,
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
          }),
          new PolicyStatement({
            effect: Effect.DENY,
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
            conditions: {
              StringNotEquals: {
                'aws:Referer': apiRefererId,
              },
            },
          }),
        ],
      }),
    });

    // 4XX系エラーレスポンスを設定
    restApi.addGatewayResponse('Api4XX', {
      type: ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
    });

    // 5XX系エラーレスポンスを設定
    restApi.addGatewayResponse('Api5XX', {
      type: ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
    });

    return restApi;
  }

  private createLambdaRole(namePrefix: string): IRole {
    return new Role(this, 'LambdaRole', {
      roleName: `${namePrefix}-lambda-role`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
  }
}
