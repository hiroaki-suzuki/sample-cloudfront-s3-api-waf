import { Construct } from 'constructs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { NodejsBuild } from 'deploy-time-build';

export interface FrontProps {
  readonly frontSourceBucket: IBucket;
  readonly distribution: IDistribution;
}

export class FrontDeploy extends Construct {
  constructor(scope: Construct, id: string, props: FrontProps) {
    super(scope, id);

    const { frontSourceBucket, distribution } = props;

    // CloudFrontのオリジンとなるフロントエンド用のS3バケットにデプロイ
    this.deployOriginTo(frontSourceBucket, distribution);
  }

  private deployOriginTo(originBucket: IBucket, distribution: IDistribution) {
    new NodejsBuild(this, 'DeployToSourceBucket', {
      assets: [
        {
          path: '../front',
          exclude: ['node_modules', 'dist'],
        },
      ],
      destinationBucket: originBucket,
      distribution,
      outputSourceDirectory: 'dist',
      buildCommands: ['npm ci', 'npm run build'],
      buildEnvironment: {
        VITE_API_ENDPOINT: `https://${distribution.distributionDomainName}/api`,
      },
    });
  }
}
