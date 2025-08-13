// app/api/assets/check/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function checkSingleDomain(domainName: string) {
  // 1. Check Live Status (HTTP Check)
  let liveStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' = 'UNKNOWN';
  try {
    // Using HEAD is faster as it doesn't download the body
    const response = await fetch(`https://${domainName}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log(response);
    liveStatus = response.ok || response.status < 400 ? 'ONLINE' : 'OFFLINE';
    console.log('Live Status:', liveStatus);
  } catch (error) {
    liveStatus = 'OFFLINE';
  }

  // 2. You could also add a WHOIS check here if needed, but for live status, HTTP is enough.

  return { liveStatus, lastChecked: new Date() };
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const asset = await db.asset.findUnique({ where: { id: id } });
    if (!asset || !asset.domainName) {
      return NextResponse.json({ error: 'Asset not found or is not a domain' }, { status: 404 });
    }

    // Get the latest status
    const { liveStatus, lastChecked } = await checkSingleDomain(asset.domainName);

    // Update the database with the new status
    const updatedAsset = await db.asset.update({
      where: { id: id },
      data: { liveStatus, lastChecked },
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}