// Malý banner nahoře – JS běží
document.addEventListener('DOMContentLoaded', () => {
  const dbg = document.createElement('div');
  dbg.textContent = 'JS main běží ✅';
  dbg.style.position = 'fixed';
  dbg.style.top = '0';
  dbg.style.left = '0';
  dbg.style.zIndex = '99999';
  dbg.style.background = '#006';
  dbg.style.color = '#fff';
  dbg.style.padding = '4px 8px';
  dbg.style.fontFamily = 'monospace';
  dbg.style.fontSize = '11px';
  document.body.appendChild(dbg);
});

// ======= Stav =======
const state = {
  layoutMode: true,
  rows: [] // { id, cols:1|2|3, blocks:[ ... ] }
};

// ======= Sloty (1–5) v localStorage =======
const SLOT_META_KEY    = 'wysi_slots_meta_v1';
const SLOT_DATA_PREFIX = 'wysi_slot_v1_';

let currentSlot = 1;   // aktivní slot (1–5)
let slotMeta    = {};  // { "1": { name: "Slot 1" }, ... }

// ======= Helper pro elementy =======
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  kids.flat().forEach(k =>
    n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k)
  );
  return n;
};

// ======= Helpers pro ID =======
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 8);


// ======= Debug overlay logger (na iPad) =======
(function () {
  const log = document.createElement('pre');
  log.id = 'jslog';
  log.style.position = 'fixed';
  log.style.top = '0';
  log.style.right = '0';
  log.style.zIndex = '9999';
  log.style.color = 'lime';
  log.style.background = 'rgba(0,0,0,.6)';
  log.style.fontSize = '11px';
  log.style.fontFamily = 'monospace';
  log.style.maxWidth = '45vw';
  log.style.maxHeight = '70vh';
  log.style.overflow = 'auto';
  log.style.margin = '0';
  log.style.padding = '4px 6px';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(log);
  });

  window._log = function (msg) {
    log.textContent += msg + '\n';
  };
})();

// ======= Slot meta: jména slotů =======
function loadSlotMeta() {
  try {
    const raw = localStorage.getItem(SLOT_META_KEY);
    if (!raw) {
      slotMeta = {
        1:{name:'Slot 1'},
        2:{name:'Slot 2'},
        3:{name:'Slot 3'},
        4:{name:'Slot 4'},
        5:{name:'Slot 5'}
      };
      return;
    }
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      slotMeta = obj;
    } else {
      throw new Error('bad meta');
    }
  } catch(e) {
    slotMeta = {
      1:{name:'Slot 1'},
      2:{name:'Slot 2'},
      3:{name:'Slot 3'},
      4:{name:'Slot 4'},
      5:{name:'Slot 5'}
    };
  }
}

function saveSlotMeta() {
  try {
    localStorage.setItem(SLOT_META_KEY, JSON.stringify(slotMeta));
  } catch(e) {
    console.warn('saveSlotMeta failed', e);
  }
}

// ======= Uložení / načtení dat slotu =======
function saveCurrentSlot() {
  try {
    const key  = SLOT_DATA_PREFIX + currentSlot;
    const data = JSON.stringify({ rows: state.rows });
    localStorage.setItem(key, data);
  } catch(e) {
    console.warn('saveCurrentSlot failed', e);
  }
}

function loadSlotData(slot) {
  const key = SLOT_DATA_PREFIX + slot;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.rows)) {
      return obj.rows;
    }
  } catch(e) {
    console.warn('loadSlotData failed', e);
  }
  return null;
}

// Default layout (použije se, pokud slot nemá žádná uložená data)
function makeDefaultLayout() {
  return [
    {
      id: uid('r'),
      title: 'Řada',
      cols: 2,
      blocks: [
        { id: uid('b'), type: 'text',   title: 'Obsah',  value: '' },
        { id: uid('b'), type: 'badges', title: 'Styly',  items: [] }
      ]
    },
    {
      id: uid('r'),
      title: 'Output',
      cols: 1,
      blocks: [
        { id: uid('b'), type: 'output', title: 'Prompt', value: '' }
      ]
    }
  ];
}

// Přepnutí slotu
function switchSlot(slot) {
  currentSlot = slot;

  const rows = loadSlotData(slot);
  if (rows) {
    state.rows = rows;
  } else {
    state.rows = makeDefaultLayout();
  }

  render();
  updateSlotButtonsUI();
}

// Aktualizace textu + active stavu tlačítek slotů
function updateSlotButtonsUI() {
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById('slot'+i+'Btn');
    if (!btn) continue;
    const name = (slotMeta[i] && slotMeta[i].name) ? slotMeta[i].name : ('Slot '+i);
    btn.textContent = name;
    btn.classList.toggle('slot-active', i === currentSlot);
  }
}

// ======= API: přidání bloků =======
function addTextBlock(row) {
  row.blocks.push({ id: uid('b'), type: 'text', title: 'Obsah', value: '' });
  render();
}
function addBadgeBlock(row) {
  row.blocks.push({ id: uid('b'), type: 'badges', title: 'Možnosti', items: [] });
  render();
}
function addSliderBlock(row) {
  row.blocks.push({
    id: uid('b'),
    type: 'sliders',
    title: 'Parametry',
    sliders: []
  });
  render();
}

// ======= Skládání výstupního promptu =======
function buildOutputText() {
  const parts = [];

  state.rows.forEach(row => {
    row.blocks.forEach(b => {
      if (b.type === 'text') {
        const t = (b.value || '').trim();
        if (t) parts.push(t);
      }
      if (b.type === 'badges' && Array.isArray(b.items)) {
        b.items.forEach(it => {
          if (it && it.active && it.payload) {
            const p = String(it.payload).trim();
            if (p) parts.push(p);
          }
        });
      }
    });
  });

  return parts.join('\n');
}

function updateOutputBlock() {
  const text = buildOutputText();
  state.rows.forEach(row => {
    row.blocks.forEach(b => {
      if (b.type === 'output') {
        b.value = text;
      }
    });
  });
}

// ======= Render řady =======
function renderRow(r) {
  const head = el(
    'div',
    { class: 'row-head' },
    el(
      'div',
      { class: 'row-controls' },
      el('span', { class: 'row-columns-label' }, 'Sloupce:'),
      el(
        'select',
        {
          class: 'row-columns-select',
          onchange: e => {
            r.cols = +e.target.value;
            render();
          }
        },
        ...[1, 2, 3].map(c =>
          el(
            'option',
            { value: c, ...(c === r.cols ? { selected: true } : {}) },
            String(c)
          )
        )
      ),
      el('button', { onclick: () => addTextBlock(r) }, '+ Text blok'),
      el('button', { onclick: () => addBadgeBlock(r) }, '+ Badge blok'),
      el('button', { onclick: () => addSliderBlock(r) }, '+ Slider blok'),
      el('button', { onclick: () => moveRow(r, -1) }, '↑'),
      el('button', { onclick: () => moveRow(r, +1) }, '↓'),
      el('button', { onclick: () => removeRow(r) }, 'Smazat řadu')
    )
  );

  const body = el(
    'div',
    { class: 'row-body cols-' + r.cols },
    r.blocks.map(b => renderBlock(r, b))
  );

  return el('section', { class: 'row' }, head, body);
}

function moveRow(r, dir) {
  const i = state.rows.findIndex(x => x.id === r.id);
  const j = i + dir;
  if (j < 0 || j >= state.rows.length) return;
  [state.rows[i], state.rows[j]] = [state.rows[j], state.rows[i]];
  render();
}

function removeRow(r) {
  state.rows = state.rows.filter(x => x.id !== r.id);
  render();
}

// ======= Autosize badge labelů =======
function resizeBadgeLabel(input) {
  if (!input) return;
  input.style.width = '1px';
  const w = input.scrollWidth + 4;
  input.style.width = w + 'px';
}

function autosizeBadges() {
  document.querySelectorAll('.badge-label').forEach(resizeBadgeLabel);
}




// ======= Sestavení outputu z textů + AKTIVNÍCH badge payloadů =======
function rebuildOutput() {
  const lines = [];

  state.rows.forEach(row => {
    row.blocks.forEach(b => {
      if (b.type === 'text' && b.value && b.value.trim()) {
        lines.push(b.value.trim());
      }
      if (b.type === 'badges' && Array.isArray(b.items)) {
        b.items.forEach(it => {
          if (it.active && it.payload && it.payload.trim()) {
            lines.push(it.payload.trim());
          }
        });
      }
    });
  });


function render() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  canvas.innerHTML = '';
  state.rows.forEach(r => canvas.appendChild(renderRow(r)));

  autosizeBadges();
  rebuildOutput();     // ať je output vždy aktuální
  saveCurrentSlot();   // 🔑 autosave do aktivního slotu
}

  
  const txt = lines.join('\n');

  let outBlock = null;
  state.rows.forEach(row => {
    row.blocks.forEach(b => {
      if (!outBlock && b.type === 'output') outBlock = b;
    });
  });

  if (outBlock) {
    outBlock.value = txt;
  }
  // 🔥 update DOM textarea v output bloku
    const outTextarea = document.querySelector('.block-output textarea');
    if (outTextarea) {
      outTextarea.value = txt;
    }
  }



// ======= Render bloků =======
function renderBlock(row, b) {
  const killBtn = el(
    'button',
    {
      class: 'block-kill edit-only',
      onclick: () => {
        row.blocks = row.blocks.filter(x => x.id !== b.id);
        render();
      }
    },
    '×'
  );

  
  if (b.type === 'text') {
    return el(
      'div',
      { class: 'block' },
      el(
        'div',
        { class: 'block-head' },
        el('input', {
          type: 'text',
          class: 'block-title',
          value: b.title,
          oninput: e => {
            b.title = e.target.value;
          }
        }),
        killBtn
      ),
      el(
        'div',
        { class: 'block-body' },
        el(
          'textarea',
          {
            placeholder: 'Text…',
            oninput: e => {
              b.value = e.target.value;
              rebuildOutput();  // aby se text taky propsal do Promptu
            }
          },
          b.value || ''
        )
      )
    );
  }

  if (b.type === 'badges') {

    // 1) Seznam badge
    const list = el(
      'div',
      { class: 'badge-list' },
      b.items.map(item => renderBadgeItem(b, item))
    );

    // 2) Toolbar musí být AŽ PO vytvoření list !
    const toolbar = el(
      'div',
      { class: 'badge-toolbar edit-only' },
      el(
        'button',
        {
          onclick: () => {
            b.items.push({
              id: uid('i'),
              label: 'Label',
              payload: '',
              active: false   // default OFF
            });
            render();
            rebuildOutput();   // ihned přepočítat výstup
          }
        },
        '+ Badge'
      )
    );

    // 3) Vracíme blok
    return el(
      'div',
      { class: 'block' },
      el(
        'div',
        { class: 'block-head' },
        el('input', {
          type: 'text',
          class: 'block-title',
          value: b.title,
          oninput: e => b.title = e.target.value
        }),
        killBtn
      ),
      el(
        'div',
        { class: 'block-body' },
        list,
        toolbar
      )
    );
  }

  
  if (b.type === 'sliders') {
    const list = el(
      'div',
      { class: 'slider-list' },
      b.sliders.map(sl => renderSliderItem(b, sl))
    );
    const toolbar = el(
      'div',
      { class: 'badge-toolbar edit-only' },
      el(
        'button',
        {
          onclick: () => {
            b.sliders.push({
              id: uid('s'),
              label: 'Parametr',
              min: 0,
              max: 100,
              step: 1,
              value: 50
            });
            render();
          }
        },
        '+ Slider'
      )
    );
    return el(
      'div',
      { class: 'block' },
      el(
        'div',
        { class: 'block-head' },
        el('input', {
          type: 'text',
          class: 'block-title',
          value: b.title,
          oninput: e => {
            b.title = e.target.value;
          }
        }),
        killBtn
      ),
      el('div', { class: 'block-body' }, list, toolbar)
    );
  }

  // ===== Output blok =====
  if (b.type === 'output') {
    const copyBtn = el(
      'button',
      {
        class: 'block-copy',
        onclick: () => {
          const text = b.value || '';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => {
              alert('Nepodařilo se zkopírovat do schránky.');
            });
          } else {
            const tmp = document.createElement('textarea');
            tmp.value = text;
            document.body.appendChild(tmp);
            tmp.select();
            try {
              document.execCommand('copy');
            } catch {
              alert('Nepodařilo se zkopírovat do schránky.');
            }
            document.body.removeChild(tmp);
          }
        }
      },
      'Copy prompt'
    );

    return el(
      'div',
      { class: 'block block-output' },
      el(
        'div',
        { class: 'block-head' },
        el('input', {
          type: 'text',
          class: 'block-title',
          value: b.title || 'Prompt',
          oninput: e => {
            b.title = e.target.value;
          }
        }),
        copyBtn
      ),
      el(
        'div',
        { class: 'block-body textarea-wrap' },
        el(
          'textarea',
          {
            readonly: true
          },
          b.value || ''
        )
      )
    );
  }

  // fallback
  return el(
    'div',
    { class: 'block' },
    el(
      'div',
      { class: 'block-head' },
      el('input', {
        type: 'text',
        class: 'block-title',
        value: 'Neznámý blok'
      }),
      killBtn
    ),
    el('div', { class: 'block-body' }, '—')
  );
}

// ======= BADGE bloky =======
function renderBadgeItem(block, item) {
  return el(
    'div',
    { class: 'badge-item' },

    // PILULKA – klik na pilulku přepíná .active
    el(
      'div',
      {
        class: 'badge-pill' + (item.active ? ' badge-pill-active' : ''),
        onclick: () => {
          item.active = !item.active;
          rebuildOutput();  // přepočítej output podle nového stavu
          render();
        }
      },
      el('input', {
        type: 'text',
        class: 'badge-label',
        placeholder: 'Title',
        value: item.label || '',
        onclick: e => e.stopPropagation(), // klik do inputu NEpřepíná active
        oninput: e => {
          item.label = e.target.value;
          resizeBadgeLabel(e.target);
        }
      }),
      el(
        'button',
        {
          class: 'badge-del edit-only',
          onclick: e => {
            e.stopPropagation(); // ať smazání taky nepřepíná active
            block.items = block.items.filter(x => x.id !== item.id);
            render();
          }
        },
        '×'
      )
    ),

    // PAYLOAD – samostatný input pod pilulkou (jen v layout módu)
    el('input', {
      type: 'text',
      class: 'badge-payload edit-only',
      placeholder: 'Hodnota (payload)',
      value: item.payload || '',
      oninput: e => {
        item.payload = e.target.value;
        rebuildOutput();   // 🔑 pokaždé přepočti output
      }
    })
  );
}

// ======= SLIDER bloky =======
function renderSliderItem(block, sl) {
  const del = el(
    'button',
    {
      class: 'slider-del edit-only',
      onclick: () => {
        block.sliders = block.sliders.filter(x => x.id !== sl.id);
        render();
      }
    },
    '×'
  );

  let val;

  return el(
    'div',
    { class: 'slider-item' },
    el('input', {
      type: 'text',
      value: sl.label,
      oninput: e => {
        sl.label = e.target.value;
      }
    }),
    el('input', {
      type: 'range',
      min: sl.min,
      max: sl.max,
      step: sl.step,
      value: sl.value,
      oninput: e => {
        sl.value = +e.target.value;
        val.value = sl.value;
      }
    }),
    (val = el('input', {
      type: 'number',
      value: sl.value,
      oninput: e => {
        sl.value = +e.target.value;
      }
    })),
    del
  );
}

// ======= Render celé canvas =======
function render() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  canvas.innerHTML = '';
  state.rows.forEach(r => canvas.appendChild(renderRow(r)));

  autosizeBadges();
}
window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  if (window._log) _log('DOMContentLoaded');

  // === Sloty – init meta ===
  loadSlotMeta();

  // Napojení slot tlačítek
  ['1','2','3','4','5'].forEach(n => {
    const btn = $('slot'+n+'Btn');
    if (!btn) return;
    btn.onclick = () => switchSlot(Number(n));
  });

  const renameBtn = $('renameSlotBtn');
  if (renameBtn) {
    renameBtn.onclick = () => {
      const curName = slotMeta[currentSlot]?.name || ('Slot '+currentSlot);
      const name = prompt('Název slotu '+currentSlot, curName);
      if (name && name.trim()) {
        if (!slotMeta[currentSlot]) slotMeta[currentSlot] = {};
        slotMeta[currentSlot].name = name.trim();
        saveSlotMeta();
        updateSlotButtonsUI();
      }
    };
  }

  // ... tady nech všechno ostatní, co už máš:
  // - btnNewRow onclick
  // - btnExport / btnImport / importFile
  // - btnRandom
  // - toggleLayoutMode + applyMode()

  // ⛔ PŮVODNÍ bootstrap (if !state.rows ...) SMAŽ
  // Místo toho:

  // Start: otevři slot 1
  switchSlot(1);
});

  // + Nová řada – vždy před output řadu
  const btnNew = $('btnNewRow');
  if (btnNew)
    btnNew.onclick = () => {
      const newRow = {
        id: uid('r'),
        title: 'Řada',
        cols: 1,
        blocks: []
      };

      const outIndex = state.rows.findIndex(row =>
        row.blocks.some(b => b.type === 'output')
      );

      if (outIndex === -1) {
        state.rows.push(newRow);
      } else {
        state.rows.splice(outIndex, 0, newRow);
      }
      render();
    };

  // Export layoutu do JSON – otevře JSON v novém panelu
  const btnExport = $('btnExport');
  if (btnExport)
    btnExport.onclick = () => {
      const data = JSON.stringify({ rows: state.rows }, null, 2);

      const win = window.open();
      if (!win) {
        alert('Pro export povol v prohlížeči otevírání nových panelů.');
        return;
      }

      const escaped = data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      win.document.open();
      win.document.write(
        '<!doctype html><meta charset="utf-8">' +
        '<title>layout.json</title>' +
        '<pre style="white-space:pre-wrap;font-family:monospace;">' +
        escaped +
        '</pre>'
      );
      win.document.close();
    };
  
  // Import layoutu z JSON
  const btnImport = $('btnImport');
  const fileInput = $('importFile');
  if (btnImport && fileInput) {
    btnImport.onclick = () => fileInput.click();
    fileInput.onchange = e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(r.result);
          if (obj && Array.isArray(obj.rows)) {
            state.rows = obj.rows;
            render();
          } else {
            alert('Soubor neobsahuje platné "rows".');
          }
        } catch {
          alert('Neplatný JSON.');
        }
      };
      r.readAsText(f);
    };
  }

  // Random – přepnutí náhodných badge (active on/off)
  const btnRandom = $('btnRandom');
  if (btnRandom)
    btnRandom.onclick = () => {
      state.rows.forEach(row => {
        row.blocks?.forEach(b => {
          if (b.type === 'badges' && Array.isArray(b.items) && b.items.length) {
            const i = Math.floor(Math.random() * b.items.length);
            b.items[i].active = !b.items[i].active;
          }
        });
      });
      render();
    };

  // Layout mód: ON = editační, OFF = kompaktní
  const chk = $('toggleLayoutMode');
  const applyMode = () => {
    document.body.classList.toggle('view-mode', chk ? !chk.checked : true);
  };
  if (chk) chk.addEventListener('change', applyMode);
  applyMode();

  // Bootstrap – výchozí layout vč. output řady
  if (!state.rows || !state.rows.length) {
    state.rows = [
      {
        id: uid('r'),
        title: 'Řada',
        cols: 2,
        blocks: [
          { id: uid('b'), type: 'text', title: 'Obsah', value: '' },
          { id: uid('b'), type: 'badges', title: 'Styly', items: [] }
        ]
      },
      {
        id: uid('r'),
        title: 'Output',
        cols: 1,
        blocks: [
          { id: uid('b'), type: 'output', title: 'Prompt', value: '' }
        ]
      }
    ];
  }

  render();
});

// ======= Globální handler JS chyb – pruh dole =======
window.onerror = function (msg, src, line, col) {
  const box = document.createElement('div');
  box.style.position = 'fixed';
  box.style.bottom = '0';
  box.style.left = '0';
  box.style.right = '0';
  box.style.background = '#300';
  box.style.color = '#fff';
  box.style.padding = '10px';
  box.style.fontFamily = 'monospace';
  box.style.fontSize = '12px';
  box.style.zIndex = '99999';
  box.textContent =
    '[JS ERROR] ' + msg + ' @ ' + src + ':' + line + ':' + col;
  document.body.appendChild(box);
};