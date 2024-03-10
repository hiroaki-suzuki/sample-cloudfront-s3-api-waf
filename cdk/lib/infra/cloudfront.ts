import { Construct } from 'constructs';
import { IBucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import {
  AllowedMethods,
  CachePolicy,
  CfnOriginAccessControl,
  Distribution,
  IDistribution,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnDistribution } from 'aws-cdk-lib/aws-lightsail';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { BaseBucket } from '../base/base-bucket';

interface CloudFrontProps {
  readonly namePrefix: string;
  readonly account: string;
  readonly frontSourceBucket: IBucket;
  readonly restApi: IRestApi;
  readonly restApiDomain: string;
  readonly webAclArn: string;
}

export class CloudFront extends Construct {
  public readonly distribution: IDistribution;

  constructor(scope: Construct, id: string, props: CloudFrontProps) {
    super(scope, id);

    const { namePrefix, account, frontSourceBucket, restApiDomain, webAclArn } = props;

    // CloudFrontのログを保存するS3バケットを作成
    const loggingBucket = this.createLoggingBucket(namePrefix);

    // CloudFrontディストリビューションを作成
    const distribution = this.createCloudFrontDistribution(
      namePrefix,
      frontSourceBucket,
      loggingBucket,
      restApiDomain,
      webAclArn,
    );

    // CloudFrontからのアクセスを許可するバケットポリシーを追加
    this.addToResourcePolicy(account, frontSourceBucket, distribution);

    this.distribution = distribution;
  }

  private createLoggingBucket(namePrefix: string): IBucket {
    return new BaseBucket(this, 'CloudFrontLogBucket', {
      bucketName: `${namePrefix}-cloudfront-log-bucket`,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });
  }

  private createCloudFrontDistribution(
    namePrefix: string,
    originBucket: IBucket,
    loggingBucket: IBucket,
    restApiDomain: string,
    webAclArn: string,
  ): Distribution {
    const distribution = new Distribution(this, 'Distribution', {
      comment: `${namePrefix}-distribution`,
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        origin: new S3Origin(originBucket, {
          originId: `${namePrefix}-front-origin`,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new HttpOrigin(restApiDomain),
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      logBucket: loggingBucket,
      enableLogging: true,
      logIncludesCookies: true,
      webAclId: webAclArn,
    });

    // オリジンアクセスコントロール (OAC)を作成
    const cfnOriginAccessControl = new CfnOriginAccessControl(this, 'FrontS3OriginAccessControl', {
      originAccessControlConfig: {
        name: `${namePrefix}-front-origin-access-control`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'Front S3 Origin Access Control',
      },
    });

    const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
    // 自動で作られるOAIをディストリビューションの紐付けを削除
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity',
      '',
    );
    // OACをディストリビューションの紐付け
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.OriginAccessControlId',
      cfnOriginAccessControl.attrId,
    );

    return distribution;
  }

  private addToResourcePolicy(
    account: string,
    sourceBucket: IBucket,
    cloudFrontDistribution: IDistribution,
  ): void {
    sourceBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [sourceBucket.bucketArn + '/*'],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${account}:distribution/${cloudFrontDistribution.distributionId}`,
          },
        },
      }),
    );
  }
}
