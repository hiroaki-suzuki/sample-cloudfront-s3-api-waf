import { Construct } from 'constructs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { BaseBucket } from '../base/base-bucket';

export interface FrontProps {
  readonly namePrefix: string;
}

export class FrontS3 extends Construct {
  public readonly sourceBucket: IBucket;

  constructor(scope: Construct, id: string, props: FrontProps) {
    super(scope, id);

    const { namePrefix } = props;

    // CloudFrontのオリジンとなるフロントエンド用のS3バケットを作成
    this.sourceBucket = this.createSourceBucket(namePrefix);
  }

  private createSourceBucket(namePrefix: string): IBucket {
    return new BaseBucket(this, 'SourceBucket', {
      bucketName: `${namePrefix}-front-source-bucket`,
    });
  }
}
