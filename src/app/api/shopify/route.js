import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import { generateRingRef, getImageUrl, normalizeText, extractSizeAndStone } from '../../utils/helpers';

// Extract stone from variant title
function extractRingStone(variantTitle) {
  const parts = variantTitle?.split('/') || [];
  return parts[1]?.trim() || '';
}

// Map product_id to coating
const productIdToCoating = {
  9755329855827: 'Oro', //Eterno Oro 
  9602265252179: 'Plata', //Soplo Plata
  9602265121107: 'Oro', //Soplo Oro
  9602260205907: 'Plata', //Coriolis Plata
  9602251882835: 'Plata', //Bóreas Plata
  9602247983443: 'Oro', //Coriolis Oro
  9602207580499: 'Oro', //Aquilo Oro
  9602206564691: 'Oro', //Susurro Oro
  9597118251347: 'Plata', //Ecos Plata
  9597117595987: 'Oro', //Ecos Oro
  9597115531603: 'Plata', //Galerno Plata
  9597113401683: 'Oro', //Poniente Oro 
  9597103702355: 'Plata', //Plasma Plata
  9596961292627: 'Plata', //Poniente Plata
  9596957917523: 'Plata', //Susurro Plata
  9596934291795: 'Oro', //Plasma Oro
  9596927476051: 'Oro', //Bóreas Oro
  9596921938259: 'Oro' //Galerno Oro 
};

export async function POST(request) {
  const rawBody = await request.text();
  const data = JSON.parse(rawBody);
  console.log('📦 Webhook received:', data);

  const lineItems = data.line_items || [];

  for (const item of data.line_items || []) {
    const rawName = item.title || item.name || '';
    const ring_model = normalizeText(rawName.trim());
    const coating = productIdToCoating[item.product_id] || 'Plata';
    const { ring_size, ring_stone } = extractSizeAndStone(item.variant_title);
  
    const order_date = data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
    const customer_ref = data.name || 'N/A';
    const image_url = getImageUrl(ring_model);
  
    const sameDayOrders = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('order_date', order_date);
  
    const ring_ref = generateRingRef(ring_model, order_date, sameDayOrders.count || 0);
  
    const newOrder = {
      ring_model,
      ring_size,
      ring_stone,
      ring_coating: coating,
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
      console.log('✅ Order saved to Supabase:', newOrder);
    }
  }

  return new NextResponse('Webhook processed', { status: 200 });
}