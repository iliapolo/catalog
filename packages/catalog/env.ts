import { CatalogStackProps } from "./stacks/catalog-stack";
import { Duration } from "@aws-cdk/core";

export const dev: CatalogStackProps = {
  twitterRateLimit: { quota: 20, window: Duration.minutes(5) },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

export const prod: CatalogStackProps = {
  // https://developer.twitter.com/en/docs/basics/rate-limits
  twitterRateLimit: { quota: 300, window: Duration.hours(3) },
  twitterSecretArn: 'arn:aws:secretsmanager:us-east-1:499430655523:secret:twitter/catalog/17099604-5EGGKe',
  domainName: 'awscdk.io',
  env: {
    account: '499430655523',
    region: 'us-east-1',
  }
};