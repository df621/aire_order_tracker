import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import { generateRingRef, getImageUrl } from '../../utils/helpers';

export async function POST(request) {
  const rawBody = await request.text();
  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error('❌ Invalid JSON:', err);
    return new NextResponse('Bad Request', { status: 400 });
  }

  console.log('📦 Webhook received:', payload);

  try {
    const item = payload.line_items?.[0];
    const title = item?.title || '';
    const variantTitle = item?.variant_title || '';
    const createdAt = payload.created_at;
    const customerRef = payload.name;

    // Extract model from title (e.g., "Aquilo" from "Aquilo - Size 8 - Oro")
    const ring_model = title.split(' - ')[0];

    // Extract size and coating from variant_title
    const parts = variantTitle.split(' - ');
    const ring_size = parts.find(p => p.match(/^\d{1,2}$/)) || '-';
    const ring_coating = parts.find(p => /oro|plata/i.test(p))?.toLowerCase() === 'oro' ? 'Oro' : 'Plata';

    // Default stones logic (like main app)
    const coatingKey = ring_coating.toLowerCase();
    const ringStoneDefaults = {
      "Galerno": { count: 1, oro: ["Prehennite"], plata: ["Prehennite"] },
      "Boreas": { count: 2, oro: ["Zafiro", "Aguamarina"], plata: ["Zafiro", "Aguamarina"] },
      "Plasma": { count: 1, oro: ["Peridoto"], plata: ["Zafiro"] },
      "Ecos": { count: 0 },
      "Aquilo": { count: 2, oro: ["Peridoto", "Amatista"], plata: ["Peridoto", "Amatista"] },
      "Coriolis": { count: 1, oro: ["Granate"], plata: ["Granate"] },
      "Eterno": { count: 1, oro: ["Blanco"], plata: ["Blanco"] },
      "Poniente": { count: 1, oro: ["Naranja"], plata: ["Naranja"] },
      "Soplo": { count: 1, oro: ["Amatista"], plata: ["Zafiro"] },
      "Susurro": { count: 1, oro: ["Aguamarina"], plata: ["Zafiro"] }
    };

    const defaults = ringStoneDefaults[ring_model]?.[coatingKey] || [];
    const count = ringStoneDefaults[ring_model]?.count || 0;
    const ring_stone = defaults.slice(0, count).join(' & ');

    const image_url = getImageUrl(ring_model);

    const today = new Date(createdAt || new Date()).toISOString().split('T')[0];
    const { data: sameDayOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('order_date', today);

    const ring_ref = generateRingRef(ring_model, today, sameDayOrders?.length || 0);

    const newOrder = {
      ring_model,
      ring_size,
      ring_coating,
      ring_stone,
      customer_ref: customerRef,
      order_date: today,
      ring_ref,
      image_url,
      stage: 'Taller',
      status: 'Pendiente'
    };

    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return new NextResponse('Failed to insert order', { status: 500 });
    }

    console.log('✅ Order saved to Supabase:', newOrder);
    return new NextResponse('Order inserted', { status: 200 });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}