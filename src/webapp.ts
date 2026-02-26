export const WebAppHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Birthday Bot Dashboard</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #0B0F19; /* Sleek, deep dark blue/black background */
      color: #F8FAFC;
      font-family: 'Outfit', sans-serif;
      -webkit-font-smoothing: antialiased;
      /* Prevent elastic bounce on iOS if needed */
      overscroll-behavior-y: none;
    }
    
    .text-gradient {
      background: linear-gradient(135deg, #a855f7, #ec4899, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .glass-card {
      background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
    }

    .modal-glass {
      background: #111827;
      border-top: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
    }

    .input-field {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      color: #F8FAFC;
      transition: all 0.3s ease;
      font-family: inherit;
    }
    .input-field:focus {
      outline: none;
      border-color: #ec4899;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
    }
    .input-field::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
    
    select.input-field {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.2em;
    }
    select.input-field option {
      background: #1f2937;
      color: #f8fafc;
    }

    .btn-gradient {
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
      transition: all 0.3s ease;
      border: none;
    }
    .btn-gradient:hover {
      box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
      transform: translateY(-1px);
    }
    .btn-gradient:active {
      transform: translateY(1px);
      box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
    }

    /* Keep scrollbar hidden for sleek look */
    ::-webkit-scrollbar { width: 0px; background: transparent; }
  </style>
</head>
<body class="p-4 relative min-h-screen pb-24">
  <div id="app" class="max-w-md mx-auto relative h-full">
    
    <header class="flex justify-between items-center mb-8 pt-2">
      <h1 class="text-4xl font-extrabold text-gradient tracking-tight">Birthdays</h1>
      <div id="userProfile" class="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-bold border border-white/20 shadow-inner">
        ?
      </div>
    </header>

    <div id="loadingState" class="flex flex-col items-center justify-center py-24 opacity-70">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
      <p class="text-sm text-gray-400 font-medium tracking-wide">Syncing data...</p>
    </div>

    <!-- Empty State -->
    <div id="emptyState" class="hidden flex-col items-center justify-center py-20 text-center space-y-4">
      <div class="text-7xl mb-2 drop-shadow-2xl">🎈</div>
      <h2 class="text-2xl font-bold tracking-tight">No birthdays yet</h2>
      <p class="text-gray-400 text-sm max-w-[200px] leading-relaxed">Add your friends and family to never miss a celebration.</p>
    </div>

    <!-- Birthday List -->
    <div id="birthdayList" class="hidden space-y-4"></div>

  </div>

  <!-- Floating Add Button -->
  <button id="addBtn" class="fixed bottom-6 right-6 h-16 w-16 rounded-full btn-gradient flex items-center justify-center text-white text-3xl font-light z-40">
    +
  </button>

  <!-- Add Modal -->
  <div id="addModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden flex-col justify-end opacity-0 transition-opacity duration-300">
    <div class="modal-glass rounded-t-3xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-transform duration-300 translate-y-full" id="modalContent">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold tracking-tight">Add Birthday</h2>
        <button id="closeModalBtn" class="bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 hover:text-white"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      
      <form id="addForm" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Name</label>
          <input type="text" id="bName" required class="input-field" placeholder="E.g., Michael Scott">
        </div>
        
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Month</label>
            <select id="bMonth" class="input-field">
              <option value="1">January</option><option value="2">February</option><option value="3">March</option>
              <option value="4">April</option><option value="5">May</option><option value="6">June</option>
              <option value="7">July</option><option value="8">August</option><option value="9">September</option>
              <option value="10">October</option><option value="11">November</option><option value="12">December</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Day</label>
            <input type="number" id="bDay" required min="1" max="31" class="input-field" placeholder="1-31">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Relationship</label>
          <select id="bRel" class="input-field">
            <option value="friend">Friend</option>
            <option value="family">Family</option>
            <option value="romantic">Romantic</option>
            <option value="colleague">Colleague</option>
          </select>
        </div>

        <div class="pt-2">
            <button type="submit" class="w-full btn-gradient py-4 rounded-xl text-white font-semibold text-lg">
              Save Birthday
            </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
      
      // Override telegram theme colors to enforce our premium dark mode
      try {
        tg.setBackgroundColor('#0B0F19');
        tg.setHeaderColor('#0B0F19');
      } catch(e) {}
      
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const initial = (u.first_name || '?').charAt(0).toUpperCase();
        document.getElementById('userProfile').innerText = initial;
      }
    }

    const initData = tg?.initData || ''; 
    const authHeaders = {
      'Authorization': 'Telegram ' + initData,
      'Content-Type': 'application/json'
    };

    // DOM Elements
    const listEl = document.getElementById('birthdayList');
    const loadingEl = document.getElementById('loadingState');
    const emptyEl = document.getElementById('emptyState');
    const modal = document.getElementById('addModal');
    const modalContent = document.getElementById('modalContent');
    const addBtn = document.getElementById('addBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const addForm = document.getElementById('addForm');

    let birthdays = [];

    const getZodiacIcon = (month, day) => {
      if ((month===3 && day>=21) || (month===4 && day<=19)) return '♈';
      if ((month===4 && day>=20) || (month===5 && day<=20)) return '♉';
      if ((month===5 && day>=21) || (month===6 && day<=20)) return '♊';
      if ((month===6 && day>=21) || (month===7 && day<=22)) return '♋';
      if ((month===7 && day>=23) || (month===8 && day<=22)) return '♌';
      if ((month===8 && day>=23) || (month===9 && day<=22)) return '♍';
      if ((month===9 && day>=23) || (month===10 && day<=22)) return '♎';
      if ((month===10 && day>=23) || (month===11 && day<=21)) return '♏';
      if ((month===11 && day>=22) || (month===12 && day<=21)) return '♐';
      if ((month===12 && day>=22) || (month===1 && day<=19)) return '♑';
      if ((month===1 && day>=20) || (month===2 && day<=18)) return '♒';
      return '♓'; 
    };

    const getRelIcon = (rel) => {
      switch(rel) {
        case 'family': return '👨‍👩‍👧';
        case 'romantic': return '❤️';
        case 'colleague': return '💼';
        default: return '🤝';
      }
    }

    // Modal logic with smooth transitions
    addBtn.onclick = () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      // Force reflow
      void modal.offsetWidth;
      modal.classList.remove('opacity-0');
      modalContent.classList.remove('translate-y-full');
    };

    const closeModal = () => {
      modalContent.classList.add('translate-y-full');
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        addForm.reset();
      }, 300);
    };
    
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); }

    const loadBirthdays = async () => {
      try {
        const res = await fetch('/api/birthdays', { headers: authHeaders });
        if (!res.ok) throw new Error('Failed to fetch');
        birthdays = await res.json();
        render();
      } catch (err) {
        console.error(err);
        if (tg) tg.showAlert('Could not load birthdays. Are you running this in Telegram?');
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        emptyEl.classList.add('flex');
      }
    };

    const deleteBirthday = async (id, el) => {
      if (tg && tg.showConfirm) {
        tg.showConfirm('Are you sure you want to delete this birthday?', async (confirmed) => {
          if (!confirmed) return;
          executeDelete(id, el);
        });
      } else {
        if (confirm('Delete this birthday?')) executeDelete(id, el);
      }
    };

    const executeDelete = async (id, el) => {
      try {
        el.style.opacity = '0.5';
        el.style.transform = 'scale(0.95)';
        const res = await fetch('/api/birthdays/' + id, { method: 'DELETE', headers: authHeaders });
        if (res.ok) {
          birthdays = birthdays.filter(b => b.id !== id);
          if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
          render();
        } else {
          throw new Error('Delete failed');
        }
      } catch (err) {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        if (tg) tg.showAlert('Error deleting.');
      }
    }

    const render = () => {
      loadingEl.classList.add('hidden');
      if (birthdays.length === 0) {
        listEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        emptyEl.classList.add('flex');
        return;
      }
      
      emptyEl.classList.add('hidden');
      emptyEl.classList.remove('flex');
      listEl.classList.remove('hidden');
      
      listEl.innerHTML = '';
      
      birthdays.forEach(b => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-4 flex items-center justify-between transition-all relative group';
        card.innerHTML = \`
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
              \${getZodiacIcon(b.birth_month, b.birth_day)}
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight tracking-wide">\${b.name} <span class="text-sm border border-white/10 bg-white/5 rounded-full px-2 py-0.5 ml-1">\${getRelIcon(b.relationship)}</span></h3>
              <p class="text-gray-400 text-sm mt-0.5 font-medium">\${monthNames[b.birth_month - 1]} \${b.birth_day}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 relative">
            <button class="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-full backdrop-blur-md transition-colors border border-white/5 hover:bg-white/10 active:scale-95 btn-manage" title="Manage Options">⚙️</button>
            <button class="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-red-400 bg-white/5 rounded-full backdrop-blur-md transition-colors border border-white/5 hover:border-red-400/30 hover:bg-red-400/10 active:scale-95 btn-delete" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        \`;

        const manageMenu = async (id, name, btn) => {
          btn.innerText = '...';
          try {
            const res = await fetch('/api/manage/' + id, { method: 'POST', headers: authHeaders });
            if (res.ok) {
              if (tg) tg.showAlert('Manage menu sent to chat!', () => { tg.close(); });
              else alert('Manage menu sent to chat!');
            } else {
              throw new Error('Manage dispatch failed');
            }
          } catch(e) {
            btn.innerText = '⚙️';
            if (tg) tg.showAlert('Failed to dispatch menu.');
          }
        };

        // Attach event handlers
        card.querySelector('.btn-delete').onclick = () => deleteBirthday(b.id, card);
        card.querySelector('.btn-manage').onclick = () => manageMenu(b.id, b.name, card.querySelector('.btn-manage'));
        
        listEl.appendChild(card);
      });
    };

    // Add submit
    addForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('bName').value,
        birth_month: parseInt(document.getElementById('bMonth').value),
        birth_day: parseInt(document.getElementById('bDay').value),
        relationship: document.getElementById('bRel').value,
      };

      try {
        const btn = addForm.querySelector('button[type="submit"]');
        const origText = btn.innerText;
        btn.innerText = 'Saving...';
        btn.disabled = true;

        const res = await fetch('/api/birthdays', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Save failed');
        
        closeModal();
        await loadBirthdays();

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        btn.innerText = origText;
        btn.disabled = false;
      } catch(err) {
        console.error(err);
        if (tg) tg.showAlert('Error saving birthday');
      }
    };

    loadBirthdays();
  </script>
</body>
</html>
`;
