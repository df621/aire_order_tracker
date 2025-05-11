import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { generateRingRef, getImageUrl } from '@/app/utils/helpers';

// Helper: Extract ring size from line item name (e.g. "Plasma Talla 18 Plata")
function extractRingSizeFromName(name) {
  const match = name.match(/Talla\s*(\d{1,2})/i);
  return match ? match[1] : null;
}

// Helper: Extract coating from name (assumes "Plata" or "Oro" is included)
function extractCoatingFromName(name) {
  if (/plata/i.test(name)) return 'Plata';
  if (/oro/i.test(name)) return 'Oro';
  return '-';
}

// Helper: Extract ring model by removing "Talla" and coating from name
function extractRingModelFromName(name) {
  return name
    .replace(/Talla\s*\d{1,2}/i, '')
    .replace(/Plata|Oro/gi, '')
    .trim();
}

export async function POST(request) {
  const rawBody = await request.text();
  const data = JSON.parse(rawBody);

  console.log('📦 Webhook received:', data);

  const lineItems = data.line_items || [];

  for (const item of lineItems) {
    const ring_model = extractRingModelFromName(item.name);
    const ring_size = extractRingSizeFromName(item.name);
    const ring_coating = extractCoatingFromName(item.name);

    const customer_ref = data.name; // e.g. "#1002"
    const order_date = data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
    const image_url = getImageUrl(ring_model);

    const sameDayOrders = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('order_date', order_date);

    const orderCount = sameDayOrders.count || 0;
    const ring_ref = generateRingRef(ring_model, order_date, orderCount);

    const newOrder = {
      ring_model,
      ring_size,
      ring_coating,
      ring_stone: '', // Leave blank or implement logic if available
      customer_ref,
      order_date,
      stage: 'Taller',
      status: 'Pendiente',
      ring_ref,
      image_url
    };

    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      console.error('❌ Error inserting order:', error.message);
    } else {
      console.log('✅ Order added:', newOrder);
    }
  }

  return new NextResponse('Webhook processed', { status: 200 });
}