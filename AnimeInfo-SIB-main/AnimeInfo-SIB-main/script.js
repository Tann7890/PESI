// ========== PERFORMANCE MONITORING ==========
// Tracking metrics untuk analisis performa
const performanceMetrics = {
  startTime: performance.now(),
  imagesLoaded: 0,
  totalImages: 0,
  dataTransferred: 0
};

// Menunggu sampai seluruh dokumen HTML dimuat
document.addEventListener('DOMContentLoaded', function () {
  initPopovers();
  initCharacterClicks();
  initLazyLoading();
  measurePerformance();
});

// ========== NAVIGATION ACTIVE STATE ==========
const links = document.querySelectorAll('.nav-link');
const current = window.location.pathname;

links.forEach(link => {
  if (link.getAttribute('href') === current.split('/').pop()) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// ========== POPOVER INITIALIZATION ==========
function initPopovers() {
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  
  [...popoverTriggerList].forEach(popoverTriggerEl => {
    new bootstrap.Popover(popoverTriggerEl, {
      trigger: 'hover',
      placement: 'right'
    });
  });
}
// Fungsi untuk membatasi input dan membersihkan karakter khusus
function initSearchValidation() {
    const searchInput = document.getElementById('animeSearch');

    if (searchInput) {
        // Mendefinisikan batas maksimal karakter
        const MAX_CHAR_LIMIT = 50;

        searchInput.addEventListener('input', function() {
            let value = this.value;

            // 1. Logika Pembatasan Karakter (Line ~43)
            if (value.length > MAX_CHAR_LIMIT) {
                // Potong string jika melebihi batas
                value = value.substring(0, MAX_CHAR_LIMIT);
                this.value = value;
                // Opsional: tampilkan pesan peringatan
                console.warn(`Pencarian dibatasi hingga ${MAX_CHAR_LIMIT} karakter.`);
            }

            // 2. Logika Penghapusan Karakter Khusus (kecuali spasi dan hyphen) (Line ~52)
            // Regex ini mengizinkan huruf, angka, dan spasi (karakter yang umum untuk nama anime)
            const cleanValue = value.replace(/[^a-zA-Z0-9\s-]/g, ''); 
            
            if (this.value !== cleanValue) {
                this.value = cleanValue;
                // Opsional: tampilkan pesan peringatan
                console.warn("Karakter khusus tidak diizinkan.");
            }
            
            // Tambahkan Pemicu Filtering di dalam event listener 'input' (Line ~58)
            searchInput.addEventListener('input', function() {
                let value = this.value;

                // 1. Logika Pembatasan Karakter
                // ... (kode pembatasan karakter) ...

                // 2. Logika Penghapusan Karakter Khusus
                // ... (kode sanitasi karakter) ...
                
                // PANGGIL FUNGSI FILTERING DI SINI
                filterAnimeList(this.value); 
            });

            // Tambahkan Pemicu saat tombol ENTER ditekan
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    // Mencegah form submit default (meski tidak ada form)
                    e.preventDefault(); 
                    // Filter akan dipicu secara otomatis oleh 'input' listener, 
                    // tapi ini memastikan user mendapatkan respon cepat setelah Enter.
                    filterAnimeList(this.value); 
                }
            });
        });
    }
}
function filterAnimeList(searchText) {
    // Ubah teks pencarian menjadi huruf kecil untuk perbandingan yang tidak case-sensitive
    const query = searchText.toLowerCase();

    // Ambil semua elemen card anime
    const animeCards = document.querySelectorAll('.anime-list .col-md-6'); 
    
    // Loop melalui setiap card anime
    animeCards.forEach(card => {
        // Ambil judul anime dari dalam card
        const titleElement = card.querySelector('.card-title');
        const title = titleElement ? titleElement.textContent.toLowerCase() : '';
        
        // Cek apakah judul anime mengandung teks pencarian
        if (title.includes(query) || query === '') {
            // Jika cocok atau input kosong, tampilkan card
            card.style.display = 'block';
        } else {
            // Jika tidak cocok, sembunyikan card
            card.style.display = 'none';
        }
    });
}


// Tambahkan panggilan fungsi baru ke dalam DOMContentLoaded (Line ~4)
document.addEventListener('DOMContentLoaded', function () {
    initPopovers();
    initCharacterClicks();
    initSearchValidation(); // PANGGIL FUNGSI BARU DI SINI
});

// ========== CHARACTER CLICK HANDLER ==========
function initCharacterClicks() {
  document.querySelectorAll('.character').forEach(character => {
    character.addEventListener('click', function () {
      const imgSrc = this.getAttribute('data-img');
      const parentModal = this.closest('.modal-body');
      const targetImg = parentModal.querySelector('img.character-img');
      
      if (targetImg) {
        targetImg.src = imgSrc;
        targetImg.style.display = 'block';
        
        // Track image load
        targetImg.onload = () => {
          performanceMetrics.imagesLoaded++;
          console.log(`Character image loaded: ${imgSrc}`);
        };
      }
    });
  });
}

// ========== LAZY LOADING IMPLEMENTATION ==========
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  performanceMetrics.totalImages = images.length;
  
  // Check for Intersection Observer support
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });
    
    images.forEach(img => {
      img.classList.add('lazy-load');
      imageObserver.observe(img);
    });
  } else {
    // Fallback untuk browser lama
    images.forEach(img => loadImage(img));
  }
}

// ========== IMAGE LOADING FUNCTION ==========
function loadImage(img) {
  const src = img.getAttribute('data-src');
  const srcset = img.getAttribute('data-srcset');
  
  if (!src) return;
  
  // Create a new image to preload
  const tempImg = new Image();
  
  tempImg.onload = () => {
    img.src = src;
    if (srcset) img.srcset = srcset;
    img.classList.add('loaded');
    
    // Track loaded images
    performanceMetrics.imagesLoaded++;
    
    // Estimate data transferred (approximate)
    estimateDataTransfer(img);
    
    console.log(`Lazy loaded: ${src}`);
  };
  
  tempImg.onerror = () => {
    console.error(`Failed to load image: ${src}`);
    img.classList.add('error');
  };
  
  tempImg.src = src;
}

// ========== DATA TRANSFER ESTIMATION ==========
function estimateDataTransfer(img) {
  // Rough estimation based on image dimensions
  if (img.naturalWidth && img.naturalHeight) {
    // Assuming average compression, estimate KB
    const estimatedSize = (img.naturalWidth * img.naturalHeight * 0.5) / 1024; // KB
    performanceMetrics.dataTransferred += estimatedSize;
  }
}

// ========== PERFORMANCE MEASUREMENT ==========
function measurePerformance() {
  window.addEventListener('load', () => {
    const loadTime = performance.now() - performanceMetrics.startTime;
    
    // Get Navigation Timing API data
    const perfData = performance.getEntriesByType('navigation')[0];
    
    // Calculate metrics
    const metrics = {
      pageLoadTime: Math.round(loadTime),
      domContentLoaded: perfData ? Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) : 0,
      imagesLoaded: performanceMetrics.imagesLoaded,
      totalImages: performanceMetrics.totalImages,
      estimatedDataTransfer: Math.round(performanceMetrics.dataTransferred),
      // Estimate carbon footprint (very rough)
      estimatedCO2: calculateCO2Estimate(performanceMetrics.dataTransferred)
    };
    
    // Log to console for analysis
    console.log('=== PERFORMANCE METRICS ===');
    console.log(`Page Load Time: ${metrics.pageLoadTime}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`Images Loaded: ${metrics.imagesLoaded}/${metrics.totalImages}`);
    console.log(`Estimated Data Transfer: ${metrics.estimatedDataTransfer} KB`);
    console.log(`Estimated CO2: ${metrics.estimatedCO2} grams`);
    console.log('=========================');
    
    // Store metrics untuk laporan
    if (typeof localStorage !== 'undefined') {
      const reportData = {
        timestamp: new Date().toISOString(),
        metrics: metrics,
        page: window.location.pathname
      };
      
      // Save to localStorage for later analysis
      const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
      reports.push(reportData);
      // Keep only last 50 reports
      if (reports.length > 50) reports.shift();
      localStorage.setItem('performanceReports', JSON.stringify(reports));
    }
  });
}

// ========== CO2 ESTIMATION ==========
// Based on: https://sustainablewebdesign.org/calculating-digital-emissions/
function calculateCO2Estimate(dataKB) {
  // Average carbon intensity: 0.5g CO2 per MB transferred
  // This is a simplified calculation
  const dataMB = dataKB / 1024;
  const co2Grams = dataMB * 0.5;
  return co2Grams.toFixed(4);
}

// ========== WEBP SUPPORT DETECTION ==========
function supportsWebP() {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

// Check WebP support and add class to html
if (supportsWebP()) {
  document.documentElement.classList.add('webp');
  console.log('✓ WebP supported');
} else {
  document.documentElement.classList.add('no-webp');
  console.log('✗ WebP not supported, using fallback');
}

// ========== PRELOAD CRITICAL RESOURCES ==========
function preloadCriticalResources() {
  // Preload important fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.href = 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
}

// Call preload function
preloadCriticalResources();

// ========== EXPORT PERFORMANCE REPORT ==========
window.exportPerformanceReport = function() {
  if (typeof localStorage === 'undefined') {
    console.error('localStorage not available');
    return;
  }
  
  const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
  
  if (reports.length === 0) {
    console.log('No performance data available yet');
    return;
  }
  
  // Calculate averages
  const avgLoadTime = reports.reduce((sum, r) => sum + r.metrics.pageLoadTime, 0) / reports.length;
  const avgDataTransfer = reports.reduce((sum, r) => sum + r.metrics.estimatedDataTransfer, 0) / reports.length;
  const avgCO2 = reports.reduce((sum, r) => sum + parseFloat(r.metrics.estimatedCO2), 0) / reports.length;
  
  const summary = {
    totalMeasurements: reports.length,
    averages: {
      pageLoadTime: Math.round(avgLoadTime) + 'ms',
      dataTransfer: Math.round(avgDataTransfer) + 'KB',
      co2Emissions: avgCO2.toFixed(4) + 'g'
    },
    allReports: reports
  };
  
  console.log('=== PERFORMANCE SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('=========================');
  
  // Download as JSON
  const dataStr = JSON.stringify(summary, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'infoanime-performance-report.json';
  link.click();
  
  return summary;
};

// Log instruction for users
console.log('📊 To export performance report, run: exportPerformanceReport()')
