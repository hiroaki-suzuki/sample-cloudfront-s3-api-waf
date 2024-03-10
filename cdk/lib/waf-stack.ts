import { Stack, StackProps } from 'aws-cdk-lib';
import { EnvValues } from './types/env-values';
import { Construct } from 'constructs';
import { Waf } from './waf/waf';

export interface WafStackProps extends StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class WafStack extends Stack {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues } = props;

    // WAFを作成
    const waf = new Waf(this, 'Waf', {
      namePrefix,
      envValues,
    });

    this.webAclArn = waf.webAcl.attrArn;
  }
}
