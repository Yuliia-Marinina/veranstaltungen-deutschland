// Known city to region map (cache for common cities)
const REGION_MAP = {
  Berlin: 'Berlin',
  München: 'Bayern',
  Munich: 'Bayern',
  Hamburg: 'Hamburg',
  Dresden: 'Sachsen',
  Düsseldorf: 'Nordrhein-Westfalen',
  Cologne: 'Nordrhein-Westfalen',
  Köln: 'Nordrhein-Westfalen',
  Frankfurt: 'Hessen',
  Stuttgart: 'Baden-Württemberg',
  Leipzig: 'Sachsen',
  Bremen: 'Bremen',
  Bochum: 'Nordrhein-Westfalen',
  Dortmund: 'Nordrhein-Westfalen',
  Essen: 'Nordrhein-Westfalen',
  Hannover: 'Niedersachsen',
  Nürnberg: 'Bayern',
  Nuremberg: 'Bayern',
};

// Get region - first check map, then fallback to Nominatim API
const getGeoRegion = async (city, lat, lng) => {
  // Check known cities first (faster, no API call)
  if (REGION_MAP[city]) return REGION_MAP[city];

  // Fallback to Nominatim reverse geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=de`;
    const response = await fetch(url);
    const data = await response.json();
    const state = data.address?.state || '';

    // Cache result for future use
    if (state) REGION_MAP[city] = state;

    return state;
  } catch (error) {
    console.error('Error fetching geo region:', error);
    return '';
  }
};

// Convert Ticketmaster event to our format
export const normalizeEvent = async (event, index) => {
  const venue = event._embedded?.venues?.[0];
  const lat = parseFloat(venue?.location?.latitude) || 51.1657;
  const lng = parseFloat(venue?.location?.longitude) || 10.4515;
  const city = venue?.city?.name || 'Deutschland';

  // Get region dynamically
  const geoRegion = await getGeoRegion(city, lat, lng);

  return {
    id: index + 1,
    ticketmasterId: event.id,
    title: event.name,
    date: formatTicketmasterDate(event.dates?.start),
    region: city,
    geoRegion,
    lat,
    lng,
    image:
      event.images?.find((img) => img.ratio === '16_9' && img.width > 500)?.url ||
      `https://picsum.photos/1200/400?random=${index}`,
    description:
      [event.description, event.info, event.pleaseNote].filter(Boolean).join('\n\n') ||
      `${event.name} findet in ${city} statt.`,
    tags: event.classifications
      ?.flatMap((c) => [c.segment?.name, c.genre?.name])
      .filter(Boolean) || ['Event'],
    time: event.dates?.start?.localTime ? formatTime(event.dates.start.localTime) : 'Siehe Website',
    address: venue ? `${venue.address?.line1 || ''}, ${venue.postalCode || ''} ${city}` : city,
    url: event.url,
    waterStation: 'DRESDEN',
  };
};

// Format date from Ticketmaster
const formatTicketmasterDate = (start) => {
  if (!start) return 'Datum unbekannt';
  const date = new Date(start.dateTime || start.localDate);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Format time
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes} Uhr`;
};
