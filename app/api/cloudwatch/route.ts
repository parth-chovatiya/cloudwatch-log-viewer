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

function getFriendlyAWSError(err: unknown) {
  if (
    typeof err === "object" &&
    err !== null &&
    ("name" in err || "__type" in err)
  ) {
    const name = (err as { name?: string; __type?: string }).name;
    const type = (err as { name?: string; __type?: string }).__type;
    if (
      name === "UnrecognizedClientException" ||
      type === "UnrecognizedClientException" ||
      name === "InvalidSignatureException" ||
      type === "InvalidSignatureException"
    ) {
      return "AWS credentials are invalid. Please check your configuration.";
    }
    if (name === "AccessDeniedException" || type === "AccessDeniedException") {
      return "Access denied. Please check your AWS permissions.";
    }
  }
  return null;
}

// GET - Fetch log groups
export async function GET() {
  try {
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
  } catch (err: unknown) {
    const friendly = getFriendlyAWSError(err);
    if (friendly) {
      return NextResponse.json({ error: friendly }, { status: 401 });
    }
    console.error("CloudWatch GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch log groups" },
      { status: 500 }
    );
  }
}

// POST - Search logs
export async function POST(req: NextRequest) {
  try {
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
      limit: limit && limit <= 10000 ? limit : 100,
      ...(logStreamName && { logStreamNames: [logStreamName] }),
      ...(filterPattern && { filterPattern }),
      ...(startTime && { startTime: Number(startTime) }),
      ...(endTime && { endTime: Number(endTime) }),
    };

    const data = await client.send(new FilterLogEventsCommand(params));
    return NextResponse.json({ events: data.events || [] });
  } catch (err: unknown) {
    const friendly = getFriendlyAWSError(err);
    if (friendly) {
      return NextResponse.json({ error: friendly }, { status: 401 });
    }
    console.error("CloudWatch POST error:", err);
    return NextResponse.json(
      { error: "Failed to search logs" },
      { status: 500 }
    );
  }
}

// PUT - Fetch log streams for a group
export async function PUT(req: NextRequest) {
  try {
    const { logGroupName } = await req.json();
    const client = getClient();

    const data = await client.send(
      new DescribeLogStreamsCommand({ logGroupName, limit: 50 })
    );
    return NextResponse.json({ logStreams: data.logStreams || [] });
  } catch (err: unknown) {
    const friendly = getFriendlyAWSError(err);
    if (friendly) {
      return NextResponse.json({ error: friendly }, { status: 401 });
    }
    console.error("CloudWatch PUT error:", err);
    return NextResponse.json(
      { error: "Failed to fetch log streams" },
      { status: 500 }
    );
  }
}
