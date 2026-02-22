import { initEventDetail } from './modules/eventDetail.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initEventDetail();
  } catch (error) {
    console.error('Unexpected error on event detail page:', error);
  }
});
