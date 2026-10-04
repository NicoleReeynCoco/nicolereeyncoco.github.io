document.addEventListener('DOMContentLoaded', () => {
  (function sprinkleDarkStars() {
    const container = document.getElementById('stardustDark');
    if (!container) return;
    
    const count = 50;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      const size = 1 + Math.random() * 2.5;
      
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = Math.random() * 100 + '%';
      dot.style.setProperty('--d', 4 + Math.random() * 8 + 's');
      dot.style.animationDelay = Math.random() * 8 + 's';
      dot.style.background = Math.random() > 0.7 ?
        'rgba(0, 212, 255, 0.15)' :
        'rgba(167, 139, 250, 0.12)';
      
      container.appendChild(dot);
    }
  })();
  
  const fileInput = document.getElementById('fileInput');
  const fileChosenText = document.getElementById('fileChosenText');
  
  if (fileInput && fileChosenText) {
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        if (fileInput.files.length === 1) {
          fileChosenText.textContent = fileInput.files[0].name;
        } else {
          fileChosenText.textContent = `${fileInput.files.length} spirits selected`;
        }
      } else {
        fileChosenText.textContent = "No spirits selected";
      }
    });
  }
});

const theme_Query = window.matchMedia('(prefers-color-scheme: dark)');
theme_Query.addEventListener('change', (event) => {
    const hash = window.location.hash;
    if (theme_Query.matches || event.matches && !hash.includes('light')) {
        // NIGHT WIND (dark theme)
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        // ADDRESS BAR THEME COLOR
        document.querySelector('meta[name="theme-color"]').content = '#13092b';
    } else {
        // Light theme
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        // ADDRESS BAR THEME COLOR
        document.querySelector('meta[name="theme-color"]').content = '#7231de';
    }
});

function applyThemes() {
    const hash = window.location.hash;
    if (hash.includes('dark')) {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        // ADDRESS BAR THEME COLOR
        document.querySelector('meta[name="theme-color"]').content = '#13092b';
    } else if (hash.includes('light')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        // ADDRESS BAR THEME COLOR
        document.querySelector('meta[name="theme-color"]').content = '#7231de';
    } else if (theme_Query.matches) {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        // ADDRESS BAR THEME COLOR
        document.querySelector('meta[name="theme-color"]').content = '#13092b';
    }
}
window.addEventListener('hashchange', applyThemes);
applyThemes();

let currentMode = 'encrypt';

function setMode(mode) {
  currentMode = mode;
  const enc = document.getElementById('tabEncrypt');
  const dec = document.getElementById('tabDecrypt');
  const btn = document.getElementById('actionBtn');
  const label = document.getElementById('fileLabel');
  
  if (mode === 'encrypt') {
    if (enc) enc.classList.add('active');
    if (dec) dec.classList.remove('active');
    if (btn) btn.textContent = `Citlalin, Itzpapa, get 'em!`;
    if (label) label.textContent = ' Dreams to Preserve';
  } else {
    if (dec) dec.classList.add('active');
    if (enc) enc.classList.remove('active');
    if (btn) btn.textContent = 'Fulfill our pact!';
    if (label) label.textContent = ' Dreams to Recall';
  }
}

function togglePasswordVisibility() {
  const keyInput = document.getElementById('keyInput');
  const eyeOffIcon = document.getElementById('eyeOffIcon');
  const eyeOnIcon = document.getElementById('eyeOnIcon');
  
  if (!keyInput) return;
  
  if (keyInput.type === 'password') {
    keyInput.type = 'url';
    if (eyeOffIcon) eyeOffIcon.classList.add('hidden');
    if (eyeOnIcon) eyeOnIcon.classList.remove('hidden');
  } else {
    keyInput.type = 'password';
    if (eyeOnIcon) eyeOnIcon.classList.add('hidden');
    if (eyeOffIcon) eyeOffIcon.classList.remove('hidden');
  }
}

function showStatus(msg, type) {
  const box = document.getElementById('statusBox');
  if (!box) return;
  
  box.className = 'rounded-xl px-4 py-3 text-sm text-center ' +
    (type === 'success' ? 'status-success' : 'status-error');
  box.textContent = msg;
  box.classList.remove('hidden');
}

function hideStatus() {
  const box = document.getElementById('statusBox');
  if (box) box.classList.add('hidden');
}
