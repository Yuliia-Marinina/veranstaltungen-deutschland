export const loadPartial = async (selector, path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load partial: ${path}`);

    const el = document.querySelector(selector);
    if (!el) {
      console.error(`loadPartial: element not found — ${selector}`);
      return;
    }

    el.innerHTML = await response.text();
  } catch (error) {
    console.error('loadPartial:', error.message);
  }
};
