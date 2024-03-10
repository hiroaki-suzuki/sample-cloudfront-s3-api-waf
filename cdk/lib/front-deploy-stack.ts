import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './types/env-values';
import { FrontDeploy } from './front/front-deploy';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';

interface FrontDeployStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly frontSourceBucket: IBucket;
  readonly distribution: IDistribution;
}

export class FrontDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontDeployStackProps) {
    super(scope, id, props);

    const { frontSourceBucket, distribution } = props;

    // デプロイ
    new FrontDeploy(this, 'FrontDeploy', {
      frontSourceBucket,
      distribution,
    });
  }
}
