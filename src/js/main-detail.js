import { initEventDetail } from './modules/eventDetail.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initEventDetail();
  } catch (error) {
    console.error('main-detail:', error.message);
  }
});
