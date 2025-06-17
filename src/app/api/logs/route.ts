import { NextResponse } from 'next/server';
import { db } from '@/db';
import { analysisLogs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// Define the structure for a new log entry, matching the schema
interface NewLogEntry {
  originalUrl: string;
  finalUrl: string;
  network: string; // 'instagram' or 'x'
  maxSeverity: 'Low' | 'Medium' | 'High' | 'None';
  findings: any; // JSON string or object
  title?: string;
  thumbnail?: string;
  sizeApprox?: number;
}

export async function GET(request: Request) {
  try {
    const logs = await db.select().from(analysisLogs).orderBy(desc(analysisLogs.timestamp));
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[API Logs GET] Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as NewLogEntry;

    // Basic validation
    if (!body.originalUrl || !body.finalUrl || !body.network || !body.maxSeverity || body.findings === undefined) {
      return NextResponse.json({ error: 'Missing required fields for log entry' }, { status: 400 });
    }

    // Mask IP - for this example, we assume it's handled upstream or not collected.
    // If IP were collected, here's where you'd mask it, e.g., userIp.replace(/\.\d+$/, '.0')

    const newLog = await db.insert(analysisLogs).values({
      originalUrl: body.originalUrl,
      finalUrl: body.finalUrl,
      network: body.network,
      maxSeverity: body.maxSeverity,
      findings: typeof body.findings === 'string' ? body.findings : JSON.stringify(body.findings),
      title: body.title,
      thumbnail: body.thumbnail,
      sizeApprox: body.sizeApprox,
      // timestamp is handled by default in schema
    }).returning();

    return NextResponse.json(newLog[0], { status: 201 });

  } catch (error) {
    console.error('[API Logs POST] Error creating log:', error);
    // Check for specific Drizzle errors or database errors if needed
    return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 });
  }
}