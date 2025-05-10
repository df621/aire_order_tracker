// src/pages/api/shopify-webhook.js
import { supabase } from '../../../lib/supabase';

console.log("Shopify Webhook Received");
console.log(await request.text());

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const order = req.body;

    // OPTIONAL: Verify Shopify HMAC if needed

    console.log("📦 Incoming order from Shopify:", order);

    // Extract and transform order data
    const transformedOrder = {
      ring_model: order.line_items[0]?.title || "Unknown",
      ring_size: order.note_attributes.find(attr => attr.name === "Size")?.value || "-",
      customer_ref: order.name || "Shopify",
      order_date: order.created_at || new Date().toISOString(),
      ring_coating: order.note_attributes.find(attr => attr.name === "Coating")?.value || "-",
      ring_stone: order.note_attributes.find(attr => attr.name === "Stone")?.value || "",
      stage: 'Taller',
      status: 'Pendiente'
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([transformedOrder]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return res.status(500).json({ error: 'Failed to save order' });
    }

    return res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}