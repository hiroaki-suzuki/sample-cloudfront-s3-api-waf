import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { BaseLogGroup } from './base-log-group';

export class BaseNodejsFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    super(scope, id, {
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      ...props,
    });

    // Lambda関数のロググループを作成
    this.createLogGroup();
  }

  private createLogGroup(): void {
    new BaseLogGroup(this, `${this.node.id}LogGroup`, {
      logGroupName: `/aws/lambda/${this.functionName}`,
    });
  }
}
