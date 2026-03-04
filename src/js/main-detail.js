import { initEventDetail } from './modules/eventDetail.js';
import { createIcons, MapPin, Calendar, Clock, Map } from 'lucide';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initEventDetail();
    createIcons({ icons: { MapPin, Calendar, Clock, Map } });
  } catch (error) {
    console.error('main-detail:', error.message);
  }
});
