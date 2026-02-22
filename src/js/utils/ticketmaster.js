// Convert Ticketmaster event to our format
export const normalizeEvent = (event, index) => {
  const venue = event._embedded?.venues?.[0];
  const lat = parseFloat(venue?.location?.latitude) || 51.1657;
  const lng = parseFloat(venue?.location?.longitude) || 10.4515;
  const city = venue?.city?.name || 'Deutschland';

  return {
    id: index + 1,
    title: event.name,
    date: formatTicketmasterDate(event.dates?.start),
    region: city,
    geoRegion: normalizeGeoRegion(city),
    lat,
    lng,
    image:
      event.images?.find((img) => img.ratio === '16_9' && img.width > 500)?.url ||
      `https://picsum.photos/1200/400?random=${index}`,
    description: event.info || event.pleaseNote || `${event.name} findet in ${city} statt.`,
    tags: event.classifications?.map((c) => c.segment?.name).filter(Boolean) || ['Event'],
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

// Map city to GeoJSON region name
const normalizeGeoRegion = (city) => {
  const regionMap = {
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
  };
  return regionMap[city] || '';
};
