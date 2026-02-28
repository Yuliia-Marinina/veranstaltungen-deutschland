export const loadPartial = async (selector, path) => {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load partial: ${path}`);

    const el = document.querySelector(selector);
    if (!el) {
      console.error(`Element not found: ${selector}`);
      return;
    }

    el.innerHTML = await res.text();
  } catch (error) {
    console.error(error);
  }
};
