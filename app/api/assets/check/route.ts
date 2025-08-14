// app/api/assets/check/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function checkSingleDomain(domainInput: string) {
  let cleanDomain: string;

  try {
    // 1. Sanitize the input to get a clean hostname
    // This logic handles all the cases you mentioned.
    let urlString = domainInput;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = `https://${urlString}`;
    }
    const urlObject = new URL(urlString);
    cleanDomain = urlObject.hostname; // Extracts 'mombaker.com' from 'https://mombaker.com/path'

  } catch (error) {
    // If the URL is still invalid after our attempt to fix it, we can't proceed.
    console.error("Invalid domain format:", domainInput);
    return { liveStatus: 'UNKNOWN' as const, lastChecked: new Date() };
  }

  // 2. Check Live Status using the clean domain
  let liveStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' = 'UNKNOWN';
  try {
    // Using HEAD is faster as it doesn't download the body
    const response = await fetch(`https://${cleanDomain}`, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
    });
    
    liveStatus = response.ok || response.status < 400 ? 'ONLINE' : 'OFFLINE';
  } catch (error) {
    // This catch handles network errors, timeouts, DNS failures, etc.
    liveStatus = 'OFFLINE';
  }

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

    console.log('Checking live status for domain:', asset);

    // Get the latest status
    const { liveStatus, lastChecked } = await checkSingleDomain(asset.domainName);
    console.log('Live Status:', liveStatus , lastChecked);

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