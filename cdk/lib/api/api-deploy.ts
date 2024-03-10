import { Construct } from 'constructs';
import { IRestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { BaseNodejsFunction } from '../base/base-nodejs-function';

export interface ApiDeployProps {
  readonly namePrefix: string;
  readonly restApi: IRestApi;
  readonly restApiLambdaRole: IRole;
}

export class ApiDeploy extends Construct {
  constructor(scope: Construct, id: string, props: ApiDeployProps) {
    super(scope, id);

    const { namePrefix, restApi, restApiLambdaRole } = props;

    this.addUsersResource(namePrefix, restApi, restApiLambdaRole);
  }

  private addUsersResource(namePrefix: string, restApi: IRestApi, restApiLambdaRole: IRole): void {
    const usersResource = restApi.root.addResource('users');

    // GET: /users
    const getUsersFunction = new BaseNodejsFunction(this, 'GetUsersFunction', {
      functionName: `${namePrefix}-get-users`,
      entry: 'lambda/getUsers.ts',
      role: restApiLambdaRole,
    });
    usersResource.addMethod('GET', new LambdaIntegration(getUsersFunction));
  }
}
