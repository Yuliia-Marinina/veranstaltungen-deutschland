import { initEventDetail } from './modules/eventDetail.js';
import { loadPartial } from './utils/loadPartial.js';
import { createIcons, MapPin, Calendar, Clock, Map } from 'lucide';

const BASE = '/veranstaltungen-deutschland';

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPartial('#header', `${BASE}/partials/header.html`),
    loadPartial('#footer', `${BASE}/partials/footer.html`),
    loadPartial('#detail-hero', `${BASE}/partials/detail-hero.html`),
    loadPartial('#detail-content', `${BASE}/partials/detail-content.html`),
  ]);

  createIcons({ icons: { MapPin, Calendar, Clock, Map } });

  try {
    await initEventDetail();
  } catch (error) {
    console.error('main-detail:', error.message);
  }

  createIcons({ icons: { MapPin, Calendar, Clock, Map } });
});
