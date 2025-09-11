import { NextResponse } from 'next/server';

export async function GET() {
  // Mock status - in real implementation would check actual automation progress
  return NextResponse.json({
    status: 'idle',
    lastRun: new Date().toISOString(),
    recipesCollected: 0,
    currentWebsite: null,
    progress: 0,
    message: 'Automation backend not fully configured. This is a UI demo.'
  });
}
