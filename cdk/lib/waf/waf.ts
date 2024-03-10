import { Construct } from 'constructs';
import { CfnIPSet, CfnLoggingConfiguration, CfnWebACL } from 'aws-cdk-lib/aws-wafv2';
import { EnvValues } from '../types/env-values';
import { BaseLogGroup } from '../base/base-log-group';

export interface WafProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class Waf extends Construct {
  public readonly webAcl: CfnWebACL;

  constructor(scope: Construct, id: string, props: WafProps) {
    super(scope, id);

    const { namePrefix, envValues } = props;

    // WAFのIPセットを作成
    const allowedIpSet = envValues.enableIpRule
      ? this.createIpSet(namePrefix, envValues.allowedIpV4)
      : null;

    // WAFのルールを作成
    const rules = this.createRules(namePrefix, allowedIpSet);

    // WAFを作成
    const webAcl = this.createWebAcl(namePrefix, allowedIpSet, rules);

    // WAFのログを設定
    this.setWafLoggingConfiguration(namePrefix, webAcl);

    this.webAcl = webAcl;
  }

  private createIpSet(namePrefix: string, allowedIpV4: string[]): CfnIPSet {
    return new CfnIPSet(this, 'IpSet', {
      name: `${namePrefix}-allowed-ip-set`,
      description: 'Allowed IP Set for CloudFront',
      scope: 'CLOUDFRONT',
      ipAddressVersion: 'IPV4',
      addresses: allowedIpV4,
    });
  }

  private createRules(namePrefix: string, allowedIpSet: CfnIPSet | null): CfnWebACL.RuleProperty[] {
    const rules: CfnWebACL.RuleProperty[] = [];

    // IPセットがある場合は、そのIPセットを許可するルールを追加
    if (allowedIpSet) {
      rules.push({
        name: 'AllowedIpSet',
        priority: rules.length,
        statement: {
          ipSetReferenceStatement: {
            arn: allowedIpSet.attrArn,
          },
        },
        action: {
          allow: {},
        },
        visibilityConfig: {
          metricName: `${namePrefix}-web-acl-AllowedIpSet`,
          cloudWatchMetricsEnabled: true,
          sampledRequestsEnabled: true,
        },
      });
    }

    // コアルールセットを追加
    rules.push({
      name: 'AWSManagedRulesCommonRuleSet',
      priority: rules.length,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesCommonRuleSet',
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        metricName: `${namePrefix}-web-acl-AWSManagedRulesCommonRuleSet`,
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
      },
    });

    return rules;
  }

  private createWebAcl(
    namePrefix: string,
    allowedIpSet: CfnIPSet | null,
    rules: CfnWebACL.RuleProperty[],
  ): CfnWebACL {
    const defaultAction = allowedIpSet ? { block: {} } : { allow: {} };

    return new CfnWebACL(this, 'WebAcl', {
      name: `${namePrefix}-web-acl`,
      description: 'Web ACL for CloudFront',
      scope: 'CLOUDFRONT',
      defaultAction: defaultAction,
      visibilityConfig: {
        metricName: `${namePrefix}-web-acl`,
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
      },
      rules: rules,
    });
  }

  private setWafLoggingConfiguration(
    namePrefix: string,
    webAcl: CfnWebACL,
  ): CfnLoggingConfiguration {
    const logGroup = new BaseLogGroup(this, 'WafLogGroup', {
      logGroupName: `aws-waf-logs-${namePrefix}-log`,
    });

    return new CfnLoggingConfiguration(this, 'WafLoggingConfiguration', {
      logDestinationConfigs: [logGroup.logGroupArn],
      resourceArn: webAcl.attrArn,
    });
  }
}
