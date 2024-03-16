import * as cdk from 'aws-cdk-lib';
import { CfnOutput, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './types/env-values';
import { CloudFront } from './infra/cloudfront';
import { FrontS3 } from './front/front-s3';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';

export interface InfraStackProps extends StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly webAclArn: string;
  readonly restApi: IRestApi;
  readonly restApiDomain: string;
}

export class InfraStack extends cdk.Stack {
  public readonly frontSourceBucket: IBucket;
  public readonly distribution: IDistribution;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues, webAclArn, restApi, restApiDomain } = props;

    // CloudFrontのオリジンとなるフロントエンド用のS3バケットを作成
    const frontS3 = new FrontS3(this, 'FrontS3', {
      namePrefix,
    });

    // CloudFrontを作成
    const cloudfront = new CloudFront(this, 'CloudFront', {
      namePrefix,
      envValues,
      account: this.account,
      frontSourceBucket: frontS3.sourceBucket,
      restApi,
      restApiDomain,
      webAclArn,
    });

    this.frontSourceBucket = frontS3.sourceBucket;
    this.distribution = cloudfront.distribution;

    new CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${cloudfront.distribution.distributionDomainName}`,
    });
  }
}
