/* SJR TECH Industries - Application Logic */

let productsData = [];
let activeCategory = 'All';
let searchQuery = '';
let quoteCart = [];

document.addEventListener('DOMContentLoaded', async () => {
  await fetchProducts();
  setupEventListeners();
  setupTheme();
  renderProducts();
  renderCategoryTabs();
  renderSingleProductPage();
});

// Fetch product catalog
async function fetchProducts() {
  try {
    const res = await fetch('products.json');
    productsData = await res.json();
  } catch (err) {
    console.error('Failed to load products.json:', err);
    showToast('⚠️ Error loading product catalog');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Search Input Listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  // Theme Toggle Listener
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Quote Drawer Toggle Listener
  const cartBtn = document.getElementById('cartDrawerBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  if (cartBtn) cartBtn.addEventListener('click', toggleQuoteDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', toggleQuoteDrawer);

  // Modal Close Listener
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOverlay = document.getElementById('productModalOverlay');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Admin Modal Listeners
  const adminBtn = document.getElementById('adminModalBtn');
  const adminOverlay = document.getElementById('adminModalOverlay');
  const adminCloseBtn = document.getElementById('adminModalCloseBtn');
  const adminForm = document.getElementById('adminProductForm');

  if (adminBtn) adminBtn.addEventListener('click', () => adminOverlay.classList.add('active'));
  if (adminCloseBtn) adminCloseBtn.addEventListener('click', () => adminOverlay.classList.remove('active'));
  if (adminForm) adminForm.addEventListener('submit', handleAdminAddProduct);

  // Quote Form Submit
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', handleQuoteSubmission);
  }

  // Main Contact Form Submit
  const mainContactForm = document.getElementById('mainContactForm');
  if (mainContactForm) {
    mainContactForm.addEventListener('submit', handleMainContactForm);
  }

  // Image Zoom Modal Overlay Click Listener
  const zoomOverlay = document.getElementById('imageZoomModal');
  if (zoomOverlay) {
    zoomOverlay.addEventListener('click', (e) => {
      if (e.target === zoomOverlay) closeImageZoomModal();
    });
  }

  // Mobile Navigation Toggle
  const mobileToggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
        navMenu.classList.remove('active');
      }
    });
  }

  // Escape key closes modals and mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeImageZoomModal();
      document.getElementById('quoteDrawer')?.classList.remove('open');
      document.getElementById('adminModalOverlay')?.classList.remove('active');
      navMenu?.classList.remove('active');
    }
  });
}

// Theme handling
function setupTheme() {
  const savedTheme = localStorage.getItem('sjr_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sjr_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Render Category Filter Tabs
function renderCategoryTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;

  const categories = ['All', ...new Set(productsData.map(p => p.category))];
  container.innerHTML = categories.map(cat => `
    <button class="category-tab ${cat === activeCategory ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCategoryTabs();
  renderProducts();
}

// Render Product Grid
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countBadge = document.getElementById('productCountBadge');
  if (!grid) return;

  const filtered = productsData.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery) ||
      p.summary.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      (p.overview || '').toLowerCase().includes(searchQuery) ||
      (p.features || []).some(f => f.toLowerCase().includes(searchQuery)) ||
      (p.product_range || []).some(r => r.toLowerCase().includes(searchQuery)) ||
      (p.applications || []).some(a => a.toLowerCase().includes(searchQuery)) ||
      Object.entries(p.specs || {}).some(([k, v]) => k.toLowerCase().includes(searchQuery) || v.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  if (countBadge) {
    countBadge.innerText = `${filtered.length} Product Category Families Found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No products match your search filter</h3>
        <p style="color: var(--text-muted);">Try searching for "Hydraulic", "Valve", "Bellows", "700 bar", "Fasteners", "PTFE", etc.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-img-wrapper" style="cursor: pointer;" onclick="window.location.href='product.html?id=${p.id}'">
        <span class="product-category-badge">${p.category}</span>
        <img src="${p.image}" alt="${p.title}" class="product-img" loading="lazy" onerror="this.src='assets/images/hero-banner.jpg'">
      </div>
      <div class="product-info">
        <h3 class="product-title" style="cursor: pointer;" onclick="window.location.href='product.html?id=${p.id}'">${p.title}</h3>
        <p class="product-summary">${p.summary}</p>
        <div class="product-features-mini">
          ${(p.features || []).slice(0, 3).map(f => `<span class="feature-pill">✓ ${f}</span>`).join('')}
        </div>
        ${p.applications && p.applications.length > 0 ? `
          <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
            ${p.applications.slice(0, 2).map(app => `<span style="font-size: 0.75rem; padding: 0.2rem 0.55rem; border-radius: 12px; background: rgba(37,99,235,0.08); color: var(--primary); font-weight: 600;">🏷️ ${app}</span>`).join('')}
            ${p.applications.length > 2 ? `<span style="font-size: 0.75rem; color: var(--text-muted); padding: 0.2rem;">+${p.applications.length - 2} more</span>` : ''}
          </div>
        ` : ''}
        <div class="product-card-actions">
          <button class="btn-specs" onclick="openProductModal(${p.id})">
            Technical Specs 📊
          </button>
          <button class="btn-inquire-icon" title="Add to Quote Request" onclick="addToQuote(${p.id})">
            ➕
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Open Product Specs Modal
function openProductModal(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  const overlay = document.getElementById('productModalOverlay');
  const body = document.getElementById('productModalBody');

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => `
    <tr>
      <td class="spec-param">⚙️ ${key}</td>
      <td class="spec-val">${val}</td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div class="modal-header-grid" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="position: relative; overflow: hidden; border-radius: var(--radius-md); border: 1px solid var(--border-gold); width: 100%;">
        <img src="${product.image}" alt="${product.title}" class="modal-product-img" style="width: 100%; height: 380px; object-fit: cover; display: block;" onerror="this.src='assets/images/hero-banner.jpg'">
        <button class="img-zoom-btn" style="position: absolute; bottom: 1rem; right: 1rem;" onclick="openImageZoomModal('${product.image}', '${product.title.replace(/'/g, "\\'")}')">
          🔍 Zoom Image
        </button>
      </div>
      <div>
        <span class="modal-category">${product.category}</span>
        <h2 class="modal-title" style="font-size: 2.2rem; font-family: var(--font-display); font-weight: 800; margin-bottom: 0.5rem;">${product.title}</h2>
        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.25rem; line-height: 1.6;">${product.summary}</p>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
          <button class="btn-primary" onclick="addToQuote(${product.id}); closeModal();">
            Request Instant Quote ✉️
          </button>
          <a href="https://wa.me/917517797417?text=Hello%20SJR%20TECH%20Industries,%20I%20am%20interested%20in%20product%20${encodeURIComponent(product.title)}." target="_blank" class="btn-whatsapp-sm" style="font-size: 0.95rem; padding: 0.75rem 1.4rem; border-radius: var(--radius-sm);">
            💬 Inquire on WhatsApp
          </a>
          <a href="product.html?id=${product.id}" class="btn-secondary" style="font-size: 0.95rem; padding: 0.75rem 1.4rem; border-radius: var(--radius-sm);">
            Full Details Page ↗
          </a>
        </div>
      </div>
    </div>

    ${product.overview ? `
      <div class="specs-section">
        <h4 class="specs-title">📖 Product Overview</h4>
        <div class="product-overview-box">
          <p>${product.overview}</p>
        </div>
      </div>
    ` : ''}

    ${product.features && product.features.length > 0 ? `
      <div class="specs-section">
        <h4 class="specs-title">✨ Key Engineering Features</h4>
        <div class="feature-cards-grid">
          ${product.features.map(f => `
            <div class="feature-card">
              <span class="feature-card-icon">✓</span>
              <span>${f}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${specsRows ? `
      <div class="specs-section">
        <h4 class="specs-title">📊 Technical Specifications</h4>
        <div class="specs-table-container">
          <table class="specs-table">
            <thead>
              <tr>
                <th>Parameter / Property</th>
                <th>Engineering Specification</th>
              </tr>
            </thead>
            <tbody>
              ${specsRows}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${product.product_range && product.product_range.length > 0 ? `
      <div class="specs-section">
        <h4 class="specs-title">📦 Product Range & Variants</h4>
        <div class="range-chip-grid">
          ${product.product_range.map(r => `<span class="range-chip">${r}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    ${product.applications && product.applications.length > 0 ? `
      <div class="specs-section">
        <h4 class="specs-title">🏭 Applications & Industries Served</h4>
        <div class="app-badge-grid">
          ${product.applications.map(app => `<span class="app-badge">🏷️ ${app}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// Quote Drawer Management
function toggleQuoteDrawer() {
  const drawer = document.getElementById('quoteDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function addToQuote(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  if (!quoteCart.some(item => item.id === id)) {
    quoteCart.push(product);
    updateQuoteCartUI();
    showToast(`Added "${product.title}" to Quote Request!`);
  } else {
    showToast(`"${product.title}" is already in your quote list!`);
  }
}

function removeFromQuote(id) {
  quoteCart = quoteCart.filter(item => item.id !== id);
  updateQuoteCartUI();
}

function updateQuoteCartUI() {
  const badge = document.getElementById('cartBadge');
  const drawerBody = document.getElementById('quoteDrawerItems');

  if (badge) badge.innerText = quoteCart.length;

  if (!drawerBody) return;

  if (quoteCart.length === 0) {
    drawerBody.innerHTML = `
      <p style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
        Your inquiry list is empty. Click ➕ on any product to add it here.
      </p>
    `;
    return;
  }

  drawerBody.innerHTML = quoteCart.map(item => `
    <div class="quote-item">
      <div class="quote-item-info">
        <h4>${item.title}</h4>
        <p>${item.category}</p>
      </div>
      <button class="remove-quote-item" onclick="removeFromQuote(${item.id})" title="Remove item">
        ✖
      </button>
    </div>
  `).join('');
}

function handleQuoteSubmission(e) {
  e.preventDefault();
  const name = document.getElementById('quoteName').value;
  const company = document.getElementById('quoteCompany').value;
  const email = document.getElementById('quoteEmail').value;
  const phone = document.getElementById('quotePhone').value;
  const notes = document.getElementById('quoteNotes').value;

  if (quoteCart.length === 0) {
    showToast('⚠️ Please add at least one product to your quote request.');
    return;
  }

  const itemsList = quoteCart.map(i => `• ${i.title}`).join('%0A');
  const message = `Hello SJR TECH Industries,%0A%0AI would like to request a quote for:%0A${itemsList}%0A%0A*Contact Details:*%0AName: ${encodeURIComponent(name)}%0ACompany: ${encodeURIComponent(company)}%0AEmail: ${encodeURIComponent(email)}%0APhone: ${encodeURIComponent(phone)}%0ANotes: ${encodeURIComponent(notes)}`;

  // WhatsApp redirect link with targeted phone number (+91 751 779 7417)
  window.open(`https://wa.me/917517797417?text=${message}`, '_blank');

  showToast('🚀 Inquiry prepared! Opening WhatsApp chat (+91 751 779 7417)...');
  quoteCart = [];
  updateQuoteCartUI();
  toggleQuoteDrawer();
}

// Main Contact Section Form Handler
function handleMainContactForm(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const company = document.getElementById('contactCompany').value;
  const email = document.getElementById('contactEmail').value;
  const phone = document.getElementById('contactPhone').value;
  const messageText = document.getElementById('contactMessage').value;

  const message = `Hello SJR TECH Industries,%0A%0AI have an inquiry regarding your industrial products:%0A*Message / Requirements:* ${encodeURIComponent(messageText)}%0A%0A*My Contact Details:*%0AName: ${encodeURIComponent(name)}%0ACompany: ${encodeURIComponent(company)}%0AEmail: ${encodeURIComponent(email)}%0APhone: ${encodeURIComponent(phone)}`;

  window.open(`https://wa.me/917517797417?text=${message}`, '_blank');
  showToast('🚀 Inquiry prepared! Directing to SJR TECH WhatsApp (+91 751 779 7417)...');
}

// Admin Add Product Handler (Generates updated products.json)
function handleAdminAddProduct(e) {
  e.preventDefault();
  const title = document.getElementById('adminTitle').value;
  const category = document.getElementById('adminCategory').value;
  const summary = document.getElementById('adminSummary').value;
  const featuresText = document.getElementById('adminFeatures').value;
  const imageName = document.getElementById('adminImage').value || 'assets/images/hero-banner.jpg';

  const newProduct = {
    id: productsData.length + 1,
    title,
    category,
    image: imageName.startsWith('assets/') ? imageName : `assets/images/${imageName}`,
    summary,
    features: featuresText.split('\n').filter(f => f.trim()),
    product_range: [],
    specs: {}
  };

  productsData.push(newProduct);
  renderCategoryTabs();
  renderProducts();

  // Export JSON file download for easy upload to Hostinger
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productsData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "products.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('✅ New Product Added! Downloaded updated products.json');
  document.getElementById('adminModalOverlay').classList.remove('active');
}

// Helper: Toast Notifications
function showToast(msg) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Render Single Product Detail Page (product.html)
function renderSingleProductPage() {
  const container = document.getElementById('productDetailWrapper');
  if (!container) return; // Not on product.html

  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get('id'), 10) || 1;
  const product = productsData.find(p => p.id === productId);

  if (!product) {
    container.innerHTML = `
      <div style="text-align: center; padding: 5rem 1rem;">
        <h2>Product Not Found</h2>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">The requested industrial product specification does not exist.</p>
        <a href="explore-products.html" class="btn-primary" style="margin-top: 1.5rem; display: inline-flex;">Explore Product Catalogue</a>
      </div>
    `;
    return;
  }

  // Update Page Title and Breadcrumbs
  document.title = `${product.title} - Specifications | SJR TECH Industries`;
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.innerText = `${product.title} | SJR TECH Industries`;

  const catBreadcrumb = document.getElementById('breadcrumbCategory');
  const titleBreadcrumb = document.getElementById('breadcrumbTitle');
  if (catBreadcrumb) catBreadcrumb.innerText = product.category;
  if (titleBreadcrumb) titleBreadcrumb.innerText = product.title;

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => `
    <tr>
      <td class="spec-param">⚙️ ${key}</td>
      <td class="spec-val">${val}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="product-detail-grid" style="display: flex; flex-direction: column; gap: 2rem;">
      <div class="product-detail-img-box" style="width: 100%;">
        <div class="product-detail-img-wrapper" style="position: relative; overflow: hidden; border-radius: var(--radius-md); width: 100%;">
          <img src="${product.image}" alt="${product.title}" class="product-detail-img" style="width: 100%; height: 480px; object-fit: cover; display: block;" onerror="this.src='assets/images/hero-banner.jpg'">
          <span class="product-category-badge" style="position: absolute; top: 1.25rem; left: 1.25rem; font-size: 0.9rem; padding: 0.45rem 1rem;">${product.category}</span>
          <button class="img-zoom-btn" style="position: absolute; bottom: 1.25rem; right: 1.25rem;" onclick="openImageZoomModal('${product.image}', '${product.title.replace(/'/g, "\\'")}')">
            🔍 Zoom Image
          </button>
        </div>
      </div>

      <div class="product-detail-contents">
        <div class="product-detail-header" style="margin-bottom: 2rem;">
          <h1 class="product-detail-title" style="font-size: 2.6rem; font-family: var(--font-display); font-weight: 800; margin-bottom: 0.75rem; line-height: 1.2;">${product.title}</h1>
          <p class="product-detail-summary" style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 1.75rem; line-height: 1.6;">${product.summary}</p>
          <div class="action-group" style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2.5rem;">
            <button class="btn-primary" style="font-size: 1.05rem; padding: 0.85rem 1.6rem;" onclick="addToQuote(${product.id});">
              Add to Quote Request 📋
            </button>
            <a href="https://wa.me/917517797417?text=Hello%20SJR%20TECH%20Industries,%20I%20am%20interested%20in%20product%20${encodeURIComponent(product.title)}%20(ID:%20${product.id})." target="_blank" class="btn-whatsapp-sm" style="font-size: 1.05rem; padding: 0.85rem 1.6rem; border-radius: var(--radius-sm);">
              💬 Direct WhatsApp Inquiry
            </a>
            <a href="mailto:sjrtechindustries@gmail.com?subject=Inquiry%20for%20${encodeURIComponent(product.title)}" class="btn-email-sm" style="font-size: 1.05rem; padding: 0.85rem 1.6rem; border-radius: var(--radius-sm);">
              ✉️ Email Sales Team
            </a>
          </div>
        </div>

        ${product.overview ? `
          <div class="doc-section">
            <h3 class="doc-title">📖 Product Overview</h3>
            <div class="product-overview-box">
              <p>${product.overview}</p>
            </div>
          </div>
        ` : ''}

        ${product.features && product.features.length > 0 ? `
          <div class="doc-section">
            <h3 class="doc-title">✨ Key Engineering Features</h3>
            <div class="feature-cards-grid">
              ${product.features.map(f => `
                <div class="feature-card">
                  <span class="feature-card-icon">✓</span>
                  <span>${f}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${specsRows ? `
          <div class="doc-section">
            <h3 class="doc-title">📊 Technical Specifications</h3>
            <div class="specs-table-container">
              <table class="specs-table">
                <thead>
                  <tr>
                    <th>Parameter / Property</th>
                    <th>Engineering Specification</th>
                  </tr>
                </thead>
                <tbody>
                  ${specsRows}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${product.product_range && product.product_range.length > 0 ? `
          <div class="doc-section">
            <h3 class="doc-title">📦 Product Range & Available Variants</h3>
            <div class="range-chip-grid">
              ${product.product_range.map(r => `<span class="range-chip">${r}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${product.applications && product.applications.length > 0 ? `
          <div class="doc-section">
            <h3 class="doc-title">🏭 Applications & Industries Served</h3>
            <div class="app-badge-grid">
              ${product.applications.map(app => `<span class="app-badge">🏷️ ${app}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="doc-section" style="background: var(--bg-card); border: 1px dashed var(--accent-gold); border-radius: var(--radius-md); padding: 1.5rem; margin-top: 1.5rem;">
          <h4 style="color: var(--accent-gold); font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            🛠️ Custom Engineering & OEM Supply Support
          </h4>
          <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;">
            Standard products as well as customized industrial solutions can be engineered and supplied as per your specific application, size, pressure rating, material grade, surface finish, technical drawing, or project requirement. Contact our technical sales team for custom fabrications and bulk orders.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Large Image Zoom Modal Handlers
function openImageZoomModal(imgSrc, title) {
  const overlay = document.getElementById('imageZoomModal');
  const imgEl = document.getElementById('imageZoomSrc');
  const titleEl = document.getElementById('imageZoomTitle');
  if (imgEl) imgEl.src = imgSrc;
  if (titleEl) titleEl.innerText = title;
  if (overlay) overlay.classList.add('active');
}

function closeImageZoomModal() {
  const overlay = document.getElementById('imageZoomModal');
  if (overlay) overlay.classList.remove('active');
}


