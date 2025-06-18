// app/api/cloudwatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
  FilterLogEventsCommandInput,
  LogGroup,
  DescribeLogGroupsCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

function getClient() {
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials or region not set in environment variables"
    );
  }
  return new CloudWatchLogsClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// GET - Fetch log groups
export async function GET() {
  const client = getClient();
  let logGroups: LogGroup[] = [];
  let nextToken: string | undefined = undefined;

  do {
    const data: DescribeLogGroupsCommandOutput = await client.send(
      new DescribeLogGroupsCommand({ limit: 50, nextToken })
    );
    logGroups = logGroups.concat(data.logGroups || []);
    nextToken = data.nextToken;
  } while (nextToken);

  return NextResponse.json({ logGroups });
}

// POST - Search logs
export async function POST(req: NextRequest) {
  const {
    logGroupName,
    logStreamName,
    filterPattern,
    startTime,
    endTime,
    limit,
  } = await req.json();
  const client = getClient();

  const params: FilterLogEventsCommandInput = {
    logGroupName,
    limit: limit || 100,
    ...(logStreamName && { logStreamNames: [logStreamName] }),
    ...(filterPattern && { filterPattern }),
    ...(startTime && { startTime: Number(startTime) }),
    ...(endTime && { endTime: Number(endTime) }),
  };

  const data = await client.send(new FilterLogEventsCommand(params));
  return NextResponse.json({ events: data.events || [] });
}

// PUT - Fetch log streams for a group
export async function PUT(req: NextRequest) {
  const { logGroupName } = await req.json();
  const client = getClient();

  const data = await client.send(
    new DescribeLogStreamsCommand({ logGroupName, limit: 50 })
  );
  return NextResponse.json({ logStreams: data.logStreams || [] });
}
