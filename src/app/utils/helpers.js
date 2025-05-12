export const ringStoneDefaults = {
  "Galerno": { count: 1, oro: ["Prehennite"], plata: ["Prehennite"] },
  "Boreas": { count: 2, oro: ["Zafiro", "Aguamarina"], plata: ["Zafiro", "Aguamarina"] },
  "Plasma": { count: 1, oro: ["Peridoto"], plata: ["Zafiro"] },
  "Ecos": { count: 0 }, // no stones
  "Aquilo": { count: 2, oro: ["Peridoto", "Amatista"], plata: ["Peridoto", "Amatista"] },
  "Coriolis": { count: 1, oro: ["Granate"], plata: ["Granate"] },
  "Eterno": { count: 1, oro: ["Blanco"], plata: ["Blanco"] },
  "Poniente": { count: 1, oro: ["Naranja"], plata: ["Naranja"] },
  "Soplo": { count: 1, oro: ["Amatista"], plata: ["Zafiro"] },
  "Susurro": { count: 1, oro: ["Aguamarina"], plata: ["Zafiro"] }
};

export const ringReference = {
  "Galerno": "001",
  "Boreas": "005",
  "Plasma": "006",
  "Ecos": "003", // no stones
  "Aquilo": "005",
  "Coriolis": "007",
  "Eterno": "009",
  "Poniente": "002",
  "Soplo": "008",
  "Susurro": "004"
}

export function generateRingRef(ringModel, orderDate, dailyCount) {
  const date = new Date(orderDate);
  const ddmm = ("0" + date.getDate()).slice(-2) + ("0" + (date.getMonth() + 1)).slice(-2);
  return ringReference[ringModel].slice(0, 3) + "/" + ddmm + ("0" + (dailyCount + 1)).slice(-2);
}

export function getImageUrl(ringModel) {
  return `https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images/${ringModel}.png`;
}

// Remove accents and normalize
export function normalizeText(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Extract ring size and stone from variant title like "10 / Amatista"
export function extractSizeAndStone(variantTitle, ring_model, coating) {
  const parts = variantTitle?.split('/') || [];
  const ring_size = parts[0]?.trim() || '-';
  let ring_stone = parts[1]?.trim() || '';

  if (!ring_stone && ring_model && coating) {
    const count = ringStoneDefaults[ring_model]?.count || 0;
    const coatingKey = coating.toLowerCase();
    const defaults = ringStoneDefaults[ring_model]?.[coatingKey] || [];
    if (count === 1) {
      ring_stone = defaults[0] || '';
    } else if (count === 2) {
      ring_stone = defaults.join(' & ');
    }
  }

  return { ring_size, ring_stone };
}







