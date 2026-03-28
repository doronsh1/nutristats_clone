

API KEY 
AQ.Ab8RN6I1PbjdDEH0vjnm7VC_FVI93fFxlU1OxJYqeOp3F94ghQ

javascript
import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
  console.error("Missing STITCH_API_KEY");
  process.exit(1);
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();
await proxy.start(transport);