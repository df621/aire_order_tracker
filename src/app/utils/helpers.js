const ringReference = {
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
function normalizeText(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Extract ring size and stone from variant title like "10 / Amatista"
function extractSizeAndStone(variantTitle) {
  if (!variantTitle) return { ring_size: '-', ring_stone: '' };
  const parts = variantTitle.split('/');
  const ring_size = parts[0]?.trim() || '-';
  const ring_stone = parts[1]?.trim() || '';
  return { ring_size, ring_stone };
}