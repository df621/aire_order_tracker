// app/api/shopify/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const rawBody = await request.text();
  const data = JSON.parse(rawBody);

  console.log('📦 Webhook received:', data); // This will show in Vercel logs

  return new NextResponse('Webhook received', { status: 200 });
}