import { PackageTableAttributes, Package } from "./schema";
import aws = require('aws-sdk');

export function env(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      throw new Error(`${name} is required`);
    }
  }

  return value;
}

export function toDynamoItem(p: Package): { [key: string]: aws.DynamoDB.AttributeValue } {
  console.log(JSON.stringify({ toDynamoItem: p }, undefined, 2));

  const output: { [key: string]: aws.DynamoDB.AttributeValue } = {
    [PackageTableAttributes.NAME]: { S: p.name },
    [PackageTableAttributes.VERSION]: { S: p.version },
    [PackageTableAttributes.METADATA]: { S: JSON.stringify(p.metadata) },
  };

  if (p.url) {
    output[PackageTableAttributes.URL] = { S: p.url };
  }
  
  return output;
}

export function extractPackageStream(sqsEvent: AWSLambda.SQSEvent): Array<Package> {
  const records = new Array<Package>();

  for (const sqsRecord of sqsEvent.Records) {
    console.log({ sqsRecord });

    if (!sqsRecord.body) {
      console.log('skipping');
      continue;
    }

    const snsEvent = JSON.parse(sqsRecord.body) as AWSLambda.SNSMessage;
    if (!snsEvent.Message) {
      console.log('skipping');
      continue;
    }

    const record = JSON.parse(snsEvent.Message) as AWSLambda.DynamoDBRecord;
    if (!record.dynamodb) {
      console.log('skipping');
      continue;
    }

    console.log({ dynamoRecord: record.dynamodb });

    records.push({
      name: parseStringValue(record.dynamodb, PackageTableAttributes.NAME),
      version: parseStringValue(record.dynamodb, PackageTableAttributes.VERSION),
      metadata: JSON.parse(parseStringValue(record.dynamodb, PackageTableAttributes.METADATA)),
      url: parseOptionStringValue(record.dynamodb, PackageTableAttributes.URL)
    });
  }

  return records;
}

function parseOptionStringValue(record: AWSLambda.StreamRecord, name: string) {
  console.log(`parsing field ${name} from ${JSON.stringify(record)}`);
  if (!record.NewImage) {
    return undefined;
  }

  const v = record.NewImage[name];
  if (!v) {
    return undefined;
  }

  const value = v.S;
  if (!value) {
    throw new Error(`Field ${name} must be a STRING`);
  }

  return value;
}

function parseStringValue(record: AWSLambda.StreamRecord, name: string) {
  const value = parseOptionStringValue(record, name);
  if (!value) {
    throw new Error(`No field ${name} in table record`);
  }
  return value;
}