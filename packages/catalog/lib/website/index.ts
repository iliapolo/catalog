import { Construct } from "@aws-cdk/core";
import s3 = require('@aws-cdk/aws-s3');
import { StaticWebsite } from "../util/static-website";
import { MaterializeBucketIndex } from "../util/materialize-bucket-index";
import { IHostedZone } from "@aws-cdk/aws-route53";
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import path = require('path');

export interface WebsiteProps {
  readonly hostedZone?: IHostedZone;
  readonly domainName?: string;
}

export class Website extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly packagesObjectPrefix = 'packages/';
  public readonly metadataFile: string = 'metadata.json';
  public readonly baseUrl: string = 'https://awscdk.io';

  constructor(scope: Construct, id: string, props: WebsiteProps = { }) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket');

    // automatically materializes all index.html files so they can be served
    // without the file name: "foo/bar/index.html" => "foo/bar" (and also "foo/bar/")
    // (cloudfront doesn't support default index files)
    new MaterializeBucketIndex(this, 'MaterializeIndexFiles', {
      bucket: this.bucket
    });

    const homePrefix = 'website/';

    new StaticWebsite(this, 'StaticWebsite', {
      bucket: this.bucket,
      hostedZone: props.hostedZone,
      domainName: props.domainName,
      indexFile: `${homePrefix}index.html`,
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: this.bucket,
      destinationKeyPrefix: homePrefix,
      sources: [ s3deploy.Source.asset(path.join(__dirname, '..', '..', 'website')) ],
    });
  }
}