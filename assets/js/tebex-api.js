import { CONFIG } from './config.js';

const BASE = 'https://headless.tebex.io/api';

const req = async (path, opts = {}) => {
  const url = `${BASE}/accounts/${CONFIG.tebex.webstoreIdent}${path}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`Tebex API ${res.status} — ${path}`);
  const json = await res.json();
  return json.data ?? json;
};

export const getCategories = () => req('/categories?includePackages=1');
export const getPackages   = () => req('/packages');
export const getPackage    = (id) => req(`/packages/${id}`);

export const createBasket = async (returnUrl, completeUrl) => {
  const body = new URLSearchParams({
    complete_url: completeUrl || location.origin,
    cancel_url:   returnUrl   || location.href,
  });
  return req('/baskets', { method: 'POST', body });
};

export const addToBasket = (basketIdent, packageId, qty = 1) => {
  const body = new URLSearchParams({ package_id: packageId, quantity: qty });
  return req(`/baskets/${basketIdent}/packages`, { method: 'POST', body });
};

export const normalize = (pkg) => ({
  id:       pkg.id,
  title:    pkg.name,
  desc:     stripHtml(pkg.description).slice(0, 140),
  price:    Number(pkg.total_price ?? pkg.base_price ?? 0),
  currency: pkg.currency || CONFIG.tebex.currency,
  image:    pkg.image || null,
  category: pkg.category?.id ?? null,
  updated:  pkg.updated_at?.slice(0, 7).replace('-', '.') ?? '',
  tag:      detectTag(pkg),
});

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const detectTag = (pkg) => {
  const created = new Date(pkg.created_at || 0).getTime();
  const now = Date.now();
  if (now - created < 30 * 864e5) return 'Nouveau';
  if (pkg.discount && Number(pkg.discount) > 0) return 'Promo';
  return null;
};

export const packageUrl = (id) =>
  `https://${CONFIG.tebex.storeDomain}/package/${id}`;

export const checkout = async (packageId) => {
  const basket = await createBasket(location.href, location.origin);
  await addToBasket(basket.ident, packageId);
  window.location.href = basket.links?.checkout || basket.checkout_url;
};
