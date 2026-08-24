import { CONFIG } from './config.js';
import { getCategories, getPackages, normalize, packageUrl, checkout } from './tebex-api.js';

const DEMO_CATS = [
  { id: 1, name: 'Métiers' },
  { id: 2, name: 'Interfaces' },
  { id: 3, name: 'Véhicules' },
  { id: 4, name: 'Outils' },
];
const DEMO_PKGS = [
  { id: 'NS-001', name: 'Police Interactive', description: 'MDT complet, menu radial, radar, fouille, système de grades hiérarchisés.', total_price: 24.99, currency: 'EUR', category: { id: 1 }, created_at: new Date().toISOString(), updated_at: '2026-01-15' },
  { id: 'NS-002', name: 'HUD Minimal',        description: 'Interface épurée, config in-game, callbacks optimisés, 0.00ms idle.',        total_price: 9.99,  currency: 'EUR', category: { id: 2 }, updated_at: '2026-01-10' },
  { id: 'NS-003', name: 'Keys System',        description: 'Clés physiques, prêt de véhicule, blacklist, intégration métiers.',         total_price: 12.99, currency: 'EUR', category: { id: 3 }, updated_at: '2025-12-20' },
  { id: 'NS-004', name: 'Mechanic Shop',      description: 'Garage complet, tuning custom, réparations, gestion des employés.',         total_price: 29.99, currency: 'EUR', category: { id: 1 }, updated_at: '2026-01-05' },
  { id: 'NS-005', name: 'Admin Suite',        description: 'Menu admin, logs Discord, permissions granulaires, anti-abuse.',            total_price: 14.99, currency: 'EUR', category: { id: 4 }, updated_at: '2025-11-28' },
  { id: 'NS-006', name: 'Inventory Weight',   description: 'Inventaire drag & drop moderne, poids réaliste, hotbar customisable.',      total_price: 34.99, currency: 'EUR', category: { id: 2 }, updated_at: '2026-01-12' },
  { id: 'NS-007', name: 'Fuel Realistic',     description: 'Stations, jerrycan, consommation dynamique, blip carburant.',               total_price: 7.99,  currency: 'EUR', category: { id: 3 }, discount: 3, updated_at: '2025-10-30' },
  { id: 'NS-008', name: 'EMS Advanced',       description: 'Ambulancier: soins avancés, transport, réanimation, statuts blessures.',    total_price: 24.99, currency: 'EUR', category: { id: 1 }, updated_at: '2025-12-15' },
];

const state = {
  packages: [],
  categories: [],
  activeCat: 'all',
};

const applyBrand = () => {
  const { brand, links, stats } = CONFIG;

  document.querySelectorAll('[data-brand-left]').forEach(el => el.textContent = brand.left);
  document.querySelectorAll('[data-brand-slash]').forEach(el => el.textContent = brand.slash);
  document.querySelectorAll('[data-brand-right]').forEach(el => el.textContent = brand.right);
  document.querySelectorAll('[data-brand-version]').forEach(el => el.textContent = `[ ${brand.version} ]`);
  document.querySelectorAll('[data-brand-location]').forEach(el => el.textContent = brand.location);
  document.querySelectorAll('[data-brand-tagline]').forEach(el => el.textContent = brand.tagline);

  document.querySelectorAll('[data-link-discord]').forEach(el => el.href = links.discord);
  document.querySelectorAll('[data-link-docs]').forEach(el => el.href = links.docs);
  document.querySelectorAll('[data-link-support]').forEach(el => el.href = links.support);
  document.querySelectorAll('[data-link-cgv]').forEach(el => el.href = links.cgv);
  document.querySelectorAll('[data-link-contact]').forEach(el => el.href = links.contact);

  const s = document.querySelector('[data-stat-resources]');
  if (s) s.textContent = stats.resources;
  const s2 = document.querySelector('[data-stat-servers]');
  if (s2) s2.textContent = stats.servers;
  const s3 = document.querySelector('[data-stat-idle-v]');
  if (s3) s3.textContent = stats.idle.value;
  const s4 = document.querySelector('[data-stat-idle-u]');
  if (s4) s4.textContent = stats.idle.unit;
};

const load = async () => {
  if (CONFIG.demoMode || !CONFIG.tebex.webstoreIdent || CONFIG.tebex.webstoreIdent.startsWith('YOUR-')) {
    state.categories = DEMO_CATS;
    state.packages   = DEMO_PKGS.map(normalize);
    return;
  }

  try {
    const [cats, pkgs] = await Promise.all([getCategories(), getPackages()]);
    state.categories = cats.map(c => ({ id: c.id, name: c.name }));
    state.packages   = pkgs.map(normalize);
  } catch (e) {
    console.error('[Tebex] fallback demo:', e);
    state.categories = DEMO_CATS;
    state.packages   = DEMO_PKGS.map(normalize);
  }
};

const renderFilters = () => {
  const bar = document.getElementById('filters');
  if (!bar) return;

  const custom = CONFIG.categories.length
    ? CONFIG.categories.map(c => ({ id: c.tebexId, label: c.label }))
    : state.categories.map(c => ({ id: c.id, label: c.name }));

  const countAll = state.packages.length;
  const chips = [
    `<button class="chip active" data-filter="all">Tout<span>${String(countAll).padStart(2, '0')}</span></button>`,
    ...custom.map(c => {
      const n = state.packages.filter(p => p.category === c.id).length;
      return `<button class="chip" data-filter="${c.id}">${c.label}<span>${String(n).padStart(2, '0')}</span></button>`;
    }),
  ].join('');

  bar.innerHTML = chips;

  bar.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelector('.chip.active')?.classList.remove('active');
      chip.classList.add('active');
      state.activeCat = chip.dataset.filter;
      renderGrid();
    });
  });
};

const renderGrid = () => {
  const grid = document.getElementById('scriptsGrid');
  if (!grid) return;

  const list = state.activeCat === 'all'
    ? state.packages
    : state.packages.filter(p => String(p.category) === String(state.activeCat));

  if (!list.length) {
    grid.innerHTML = `<div class="empty">Aucun script dans cette catégorie.</div>`;
    return;
  }

  const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CONFIG.tebex.currency });

  grid.innerHTML = list.map((p, idx) => `
    <article class="item" data-cat="${p.category ?? ''}">
      <div class="item__img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.title}" loading="lazy" />`
          : `<div class="item__img-ph">${(p.title || '?').charAt(0)}</div>`}
      </div>
      <div class="item__head">
        <span>NS-${String(p.id).padStart(3, '0').slice(-4)}</span>
        ${p.tag ? `<span class="item__tag">${p.tag}</span>` : `<span>N° ${String(idx + 1).padStart(2, '0')}</span>`}
      </div>
      <div class="item__body">
        <h3 class="item__title">${p.title}</h3>
        <p class="item__desc">${p.desc}</p>
      </div>
      <div class="item__meta">
        <span>${categoryName(p.category)}</span>
        ${p.updated ? `<span>Update ${p.updated}</span>` : ''}
      </div>
      <div class="item__foot">
        <div class="item__price">${fmt.format(p.price)}<small>TTC</small></div>
        <button class="item__buy" data-id="${p.id}">Acheter <span class="arrow">→</span></button>
      </div>
    </article>
  `).join('');
};

const categoryName = (id) => {
  const c = state.categories.find(x => x.id === id);
  return c ? c.name : '—';
};

const handleBuy = async (packageId) => {
  if (CONFIG.tebex.checkoutMode === 'basket') {
    try { await checkout(packageId); }
    catch (e) { console.error(e); window.open(packageUrl(packageId), '_blank', 'noopener'); }
  } else {
    window.open(packageUrl(packageId), '_blank', 'noopener');
  }
};

const setupNav = () => {
  const burger = document.getElementById('burger');
  const links  = document.querySelector('.nav__links');
  burger?.addEventListener('click', () => links.classList.toggle('open'));
  links?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
};

const init = async () => {
  applyBrand();
  setupNav();
  await load();
  renderFilters();
  renderGrid();

  document.getElementById('scriptsGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.item__buy');
    if (btn) handleBuy(btn.dataset.id);
  });
};

init();
