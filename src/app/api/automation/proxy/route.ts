import { NextResponse } from 'next/server';

// Proxy API route to avoid Mixed Content issues
// This allows the HTTPS frontend to communicate with the HTTP backend
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to your local webhook server
    const backendUrl = 'http://192.168.1.151:3002/api/automation/start';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to automation backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
