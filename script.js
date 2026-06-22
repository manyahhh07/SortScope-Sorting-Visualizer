/* ============================================================
   SORTING VISUALIZER — script.js
   9 Algorithms: Bubble, Selection, Insertion, Merge, Quick,
   Heap (comparison) + Counting, Radix, Bucket (non-comparison)
   Web Audio API for sound synthesis
   ============================================================ */

'use strict';

/* ── Algorithm Metadata ──────────────────────────────────── */
const ALGOS = [
  {
    id: 'bubble', name: 'Bubble Sort', type: 'comparison',
    best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    bc: 'cb-n', ac: 'cb-n2', wc: 'cb-n2',
    desc: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.'
  },
  {
    id: 'selection', name: 'Selection Sort', type: 'comparison',
    best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    bc: 'cb-n2', ac: 'cb-n2', wc: 'cb-n2',
    desc: 'Divides input into sorted and unsorted regions. Repeatedly selects the minimum from the unsorted region.'
  },
  {
    id: 'insertion', name: 'Insertion Sort', type: 'comparison',
    best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    bc: 'cb-n', ac: 'cb-n2', wc: 'cb-n2',
    desc: 'Builds the sorted array one element at a time by inserting each new element into its correct position.'
  },
  {
    id: 'merge', name: 'Merge Sort', type: 'comparison',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    bc: 'cb-nlogn', ac: 'cb-nlogn', wc: 'cb-nlogn',
    desc: 'Divide and conquer: splits the array in halves recursively, then merges the sorted halves back together.'
  },
  {
    id: 'quick', name: 'Quick Sort', type: 'comparison',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
    bc: 'cb-nlogn', ac: 'cb-nlogn', wc: 'cb-n2',
    desc: 'Picks a pivot, partitions elements around it, then recursively sorts the sub-arrays on each side.'
  },
  {
    id: 'heap', name: 'Heap Sort', type: 'comparison',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)',
    bc: 'cb-nlogn', ac: 'cb-nlogn', wc: 'cb-nlogn',
    desc: 'Builds a max-heap, then repeatedly extracts the maximum element to produce a sorted array.'
  },
  {
    id: 'counting', name: 'Counting Sort', type: 'non-comparison',
    best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)',
    bc: 'cb-nk', ac: 'cb-nk', wc: 'cb-nk',
    desc: 'Counts occurrences of each value, then uses prefix sums to place each element directly in its sorted position.'
  },
  {
    id: 'radix', name: 'Radix Sort', type: 'non-comparison',
    best: 'O(nk)', avg: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)',
    bc: 'cb-nk', ac: 'cb-nk', wc: 'cb-nk',
    desc: 'Sorts digit by digit from least significant to most significant using counting sort as a subroutine.'
  },
  {
    id: 'bucket', name: 'Bucket Sort', type: 'non-comparison',
    best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n²)', space: 'O(n)',
    bc: 'cb-nk', ac: 'cb-nk', wc: 'cb-n2',
    desc: 'Distributes elements into buckets, sorts each bucket individually, then concatenates the results.'
  },
];

/* ── State ───────────────────────────────────────────────── */
let array        = [];
let running      = false;
let stopped      = false;
let selectedAlgo = 'bubble';
let soundOn      = true;
let audioCtx     = null;
let comps        = 0;
let swaps        = 0;
let startTime    = 0;

/* ── DOM References ──────────────────────────────────────── */
const $ = id => document.getElementById(id);

const algoGrid       = $('algoGrid');
const complexityGrid = $('complexityGrid');
const vizCanvas      = $('vizCanvas');
const statusBar      = $('statusBar');
const compCountEl    = $('compCount');
const swapCountEl    = $('swapCount');
const timeEl         = $('timeEl');
const arraySizeEl    = $('arraySizeEl');
const sortBtn        = $('sortBtn');
const genBtn         = $('genBtn');
const stopBtn        = $('stopBtn');
const soundBtn       = $('soundBtn');
const sizeSlider     = $('sizeSlider');
const sizeVal        = $('sizeVal');
const speedSlider    = $('speedSlider');
const speedVal       = $('speedVal');
const algoDisplayName = $('algoDisplayName');
const algoDisplayType = $('algoDisplayType');

/* ── Audio ───────────────────────────────────────────────── */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, type = 'sine', duration = 0.08, volume = 0.08) {
  if (!soundOn) return;
  initAudio();
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode   = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(50, Math.min(2000, freq)), audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) { /* ignore audio errors */ }
}

function playCompare(value)  { playTone(180 + value * 3.5, 'sine',     0.06, 0.06); }
function playSwap(value)     { playTone(250 + value * 4.0, 'sawtooth', 0.08, 0.07); }
function playPlace(value)    { playTone(150 + value * 3.0, 'triangle', 0.05, 0.07); }
function playSortedChime(v)  { playTone(400 + v * 2,       'sine',     0.12, 0.10); }

function playCompletionFanfare() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.25, 0.13), i * 70);
  });
}

/* ── Render ──────────────────────────────────────────────── */
function renderBars(arr, colorMap = {}) {
  const maxVal  = Math.max(...arr, 1);
  const canvasW = vizCanvas.clientWidth || 700;
  const barW    = Math.max(2, Math.floor((canvasW - arr.length) / arr.length));

  vizCanvas.innerHTML = '';

  arr.forEach((val, i) => {
    const bar     = document.createElement('div');
    bar.className = 'bar';
    const heightPct = (val / maxVal) * 100;
    const color     = colorMap[i] || '#252540';
    bar.style.cssText = `height:${heightPct}%;width:${barW}px;background:${color};`;
    vizCanvas.appendChild(bar);
  });
}

/* ── Stats ───────────────────────────────────────────────── */
function updateStats() {
  compCountEl.textContent = comps.toLocaleString();
  swapCountEl.textContent = swaps.toLocaleString();
  timeEl.textContent      = (Date.now() - startTime) + 'ms';
}

function resetStats() {
  comps = 0; swaps = 0; startTime = Date.now();
  compCountEl.textContent = '0';
  swapCountEl.textContent = '0';
  timeEl.textContent      = '0ms';
}

/* ── Helpers ─────────────────────────────────────────────── */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  const speed = parseInt(speedSlider.value);
  // Exponential: speed 1 = ~200ms, speed 10 = ~2ms
  return Math.max(1, Math.round(180 / Math.pow(speed, 1.5)));
}

function setStatus(text) {
  statusBar.textContent = text;
}

// Returns a colorMap with all indices >= startIdx colored as sorted
function sortedColors(arr, startIdx) {
  const c = {};
  for (let i = startIdx; i < arr.length; i++) c[i] = '#10b981';
  return c;
}

// Build a colorMap marking a range
function rangeColor(start, end, color) {
  const c = {};
  for (let i = start; i <= end; i++) c[i] = color;
  return c;
}

async function mark(arr, colorMap, delayOverride = null) {
  if (stopped) throw 'stopped';
  renderBars(arr, colorMap);
  updateStats();
  const delay = delayOverride !== null ? delayOverride : getDelay();
  if (delay > 0) await sleep(delay);
}

/* ── Sorting Algorithms ──────────────────────────────────── */

// 1. Bubble Sort
async function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comps++;
      playCompare(a[j]);
      const cmap = { [j]: '#7c3aed', [j + 1]: '#7c3aed', ...sortedColors(a, n - i) };
      await mark(a, cmap);

      if (a[j] > a[j + 1]) {
        swaps++;
        playSwap(a[j]);
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        await mark(a, { [j]: '#ef4444', [j + 1]: '#ef4444', ...sortedColors(a, n - i) });
      }
    }
    playSortedChime(a[n - i - 1]);
    if (!swapped) break; // already sorted
  }
}

// 2. Selection Sort
async function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comps++;
      playCompare(a[j]);
      const cmap = { [i]: '#f59e0b', [minIdx]: '#7c3aed', [j]: '#a855f7', ...sortedColors(a, 0) };
      // override sorted colors only up to i
      const cmap2 = {};
      for (let k = 0; k < i; k++) cmap2[k] = '#10b981';
      cmap2[i]      = '#f59e0b';
      cmap2[minIdx] = '#7c3aed';
      cmap2[j]      = '#a855f7';
      await mark(a, cmap2);
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      swaps++;
      playSwap(a[i]);
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      const c2 = {};
      for (let k = 0; k < i; k++) c2[k] = '#10b981';
      c2[i] = '#ef4444';
      await mark(a, c2);
    }
    playSortedChime(a[i]);
    const c3 = {};
    for (let k = 0; k <= i; k++) c3[k] = '#10b981';
    await mark(a, c3);
  }
}

// 3. Insertion Sort
async function insertionSort(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    playCompare(key);
    await mark(a, { [i]: '#f59e0b' });

    while (j >= 0 && a[j] > key) {
      comps++;
      swaps++;
      playSwap(a[j]);
      a[j + 1] = a[j];
      j--;
      await mark(a, { [j + 1]: '#ef4444', [j + 2]: '#7c3aed' });
    }
    a[j + 1] = key;
    playSortedChime(key);
    await mark(a, { [j + 1]: '#10b981' });
  }
}

// 4. Merge Sort
async function mergeSort(a) {
  async function _mergeSort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    await _mergeSort(l, m);
    await _mergeSort(m + 1, r);
    await _merge(a, l, m, r);
  }

  async function _merge(arr, l, m, r) {
    const left  = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    while (i < left.length && j < right.length) {
      comps++;
      playCompare(left[i]);
      const cmap = rangeColor(l, r, '#06b6d4');
      await mark(arr, cmap);

      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
      swaps++;
    }
    while (i < left.length) { arr[k++] = left[i++]; swaps++; }
    while (j < right.length) { arr[k++] = right[j++]; swaps++; }

    const cmap = rangeColor(l, r, '#10b981');
    await mark(arr, cmap);
  }

  await _mergeSort(0, a.length - 1);
}

// 5. Quick Sort
async function quickSort(a) {
  async function _quickSort(l, r) {
    if (l >= r) return;
    const pivotIdx = await _partition(l, r);
    await _quickSort(l, pivotIdx - 1);
    await _quickSort(pivotIdx + 1, r);
  }

  async function _partition(l, r) {
    const pivot = a[r];
    let i = l - 1;

    for (let j = l; j < r; j++) {
      comps++;
      playCompare(a[j]);
      await mark(a, { [r]: '#f59e0b', [j]: '#7c3aed' });

      if (a[j] <= pivot) {
        i++;
        swaps++;
        playSwap(a[i]);
        [a[i], a[j]] = [a[j], a[i]];
        await mark(a, { [r]: '#f59e0b', [i]: '#ef4444', [j]: '#ef4444' });
      }
    }
    swaps++;
    [a[i + 1], a[r]] = [a[r], a[i + 1]];
    playSortedChime(a[i + 1]);
    await mark(a, { [i + 1]: '#10b981' });
    return i + 1;
  }

  await _quickSort(0, a.length - 1);
}

// 6. Heap Sort
async function heapSort(a) {
  const n = a.length;

  async function _heapify(size, root) {
    let largest = root;
    const l = 2 * root + 1;
    const r = 2 * root + 2;

    comps++;
    if (l < size && a[l] > a[largest]) largest = l;
    comps++;
    if (r < size && a[r] > a[largest]) largest = r;

    if (largest !== root) {
      swaps++;
      playSwap(a[root]);
      [a[root], a[largest]] = [a[largest], a[root]];
      await mark(a, { [root]: '#ef4444', [largest]: '#7c3aed' });
      await _heapify(size, largest);
    }
  }

  // Build max-heap
  setStatus('Building max-heap...');
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await _heapify(n, i);
  }

  // Extract elements one by one
  setStatus('Extracting from heap...');
  for (let i = n - 1; i > 0; i--) {
    swaps++;
    playSwap(a[0]);
    [a[0], a[i]] = [a[i], a[0]];
    playSortedChime(a[i]);
    await mark(a, { [0]: '#ef4444', [i]: '#10b981', ...sortedColors(a, i) });
    await _heapify(i, 0);
  }
}

// 7. Counting Sort
async function countingSort(a) {
  const max  = Math.max(...a);
  const min  = Math.min(...a);
  const range = max - min + 1;

  setStatus('Counting occurrences...');
  const count = new Array(range).fill(0);
  for (let i = 0; i < a.length; i++) {
    count[a[i] - min]++;
    comps++;
    playTone(200 + (a[i] / max) * 400, 'sine', 0.04, 0.06);
    await mark(a, { [i]: '#06b6d4' });
  }

  setStatus('Reconstructing array...');
  let idx = 0;
  for (let i = 0; i < range; i++) {
    while (count[i] > 0) {
      a[idx] = i + min;
      count[i]--;
      swaps++;
      playPlace(a[idx]);
      const cmap = {};
      for (let k = 0; k < idx; k++) cmap[k] = '#10b981';
      cmap[idx] = '#06b6d4';
      await mark(a, cmap);
      idx++;
    }
  }
}

// 8. Radix Sort
async function radixSort(a) {
  const max = Math.max(...a);

  async function _countingPass(arr, exp) {
    const n      = arr.length;
    const output = new Array(n).fill(0);
    const count  = new Array(10).fill(0);

    for (let i = 0; i < n; i++) {
      const digit = Math.floor(arr[i] / exp) % 10;
      count[digit]++;
      comps++;
    }
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];

    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit]--;
      swaps++;
      playTone(120 + digit * 60, 'sine', 0.04, 0.06);
      await mark(arr, { [i]: '#06b6d4' });
    }

    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
      playTone(180 + arr[i] * 3, 'triangle', 0.04, 0.06);
      const cmap = {};
      for (let k = 0; k <= i; k++) cmap[k] = '#f59e0b';
      await mark(arr, cmap);
    }
  }

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const digits = Math.log10(exp) + 1;
    setStatus(`Sorting by digit position ${Math.round(digits)}...`);
    await _countingPass(a, exp);
  }
}

// 9. Bucket Sort
async function bucketSort(a) {
  const n   = a.length;
  const max = Math.max(...a);
  const min = Math.min(...a);

  setStatus('Distributing into buckets...');
  const buckets = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const normalized = (a[i] - min) / (max - min + 1);
    const bi         = Math.min(Math.floor(normalized * n), n - 1);
    buckets[bi].push(a[i]);
    swaps++;
    playTone(120 + bi * 10, 'sine', 0.04, 0.07);
    await mark(a, { [i]: '#06b6d4' });
  }

  setStatus('Sorting buckets and merging...');
  let k = 0;
  for (let b = 0; b < buckets.length; b++) {
    buckets[b].sort((x, y) => x - y);
    for (const val of buckets[b]) {
      a[k] = val;
      comps++;
      playPlace(val);
      const cmap = {};
      for (let j = 0; j < k; j++) cmap[j] = '#10b981';
      cmap[k] = '#f59e0b';
      await mark(a, cmap);
      k++;
    }
  }
}

/* ── Sort Dispatcher ─────────────────────────────────────── */
async function runSort() {
  if (running) return;
  running = true;
  stopped = false;
  resetStats();

  const algo = ALGOS.find(a => a.id === selectedAlgo);
  const a    = [...array];

  setStatus(`Running ${algo.name}...`);
  sortBtn.disabled    = true;
  genBtn.disabled     = true;
  stopBtn.style.display = '';

  const sortFns = {
    bubble:    bubbleSort,
    selection: selectionSort,
    insertion: insertionSort,
    merge:     mergeSort,
    quick:     quickSort,
    heap:      heapSort,
    counting:  countingSort,
    radix:     radixSort,
    bucket:    bucketSort,
  };

  try {
    await sortFns[selectedAlgo](a);

    // Final green pass
    const allGreen = {};
    a.forEach((_, i) => allGreen[i] = '#10b981');
    renderBars(a, allGreen);
    array = a;

    playCompletionFanfare();
    const elapsed = Date.now() - startTime;
    setStatus(
      `${algo.name} complete — ${comps.toLocaleString()} comparisons, ` +
      `${swaps.toLocaleString()} swaps in ${elapsed}ms`
    );
    updateStats();

  } catch (e) {
    if (e === 'stopped') {
      setStatus('Stopped.');
    } else {
      console.error('Sort error:', e);
      setStatus('An error occurred.');
    }
  }

  running  = false;
  sortBtn.disabled     = false;
  genBtn.disabled      = false;
  stopBtn.style.display = 'none';
}

/* ── Array Generation ────────────────────────────────────── */
function generateArray() {
  const n = parseInt(sizeSlider.value);
  array   = Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
  arraySizeEl.textContent = n;
  renderBars(array, {});
  resetStats();
  setStatus('Select an algorithm and press Sort');
}

/* ── UI Builder ──────────────────────────────────────────── */
function buildAlgoGrid() {
  algoGrid.innerHTML = '';
  const activeType = document.querySelector('.type-tab.active')?.dataset.type || 'all';

  ALGOS.forEach(algo => {
    const btn = document.createElement('div');
    btn.className = 'algo-btn' +
      (algo.id === selectedAlgo ? ' active' : '') +
      (activeType !== 'all' && algo.type !== activeType ? ' hidden' : '');

    btn.innerHTML = `
      <span class="algo-btn-name">${algo.name}</span>
      <span class="algo-btn-type">${algo.type}</span>
      <span class="complexity-badge ${algo.ac}">${algo.avg}</span>
    `;

    btn.addEventListener('click', () => {
      if (running) return;
      selectedAlgo = algo.id;
      // Update display
      algoDisplayName.textContent = algo.name;
      algoDisplayType.textContent = algo.type;
      // Refresh grid
      buildAlgoGrid();
      // Highlight active complexity card
      document.querySelectorAll('.cp-card').forEach(c => {
        c.classList.toggle('cp-active', c.dataset.id === algo.id);
      });
    });

    algoGrid.appendChild(btn);
  });
}

function buildComplexityGrid() {
  complexityGrid.innerHTML = '';

  ALGOS.forEach(algo => {
    const card = document.createElement('div');
    card.className = 'cp-card' + (algo.id === selectedAlgo ? ' cp-active' : '');
    card.dataset.id = algo.id;

    const rowClass = (cls) => {
      if (cls === 'cb-nlogn') return 'cp-good';
      if (cls === 'cb-n')     return 'cp-good';
      if (cls === 'cb-nk')    return 'cp-blue';
      if (cls === 'cb-n2')    return 'cp-bad';
      return 'cp-mid';
    };

    card.innerHTML = `
      <div class="cp-algo-name">${algo.name}</div>
      <div class="cp-algo-type">${algo.type}</div>
      <div class="cp-row">
        <span class="cp-key">Best</span>
        <span class="${rowClass(algo.bc)}">${algo.best}</span>
      </div>
      <div class="cp-row">
        <span class="cp-key">Average</span>
        <span class="${rowClass(algo.ac)}">${algo.avg}</span>
      </div>
      <div class="cp-row">
        <span class="cp-key">Worst</span>
        <span class="${rowClass(algo.wc)}">${algo.worst}</span>
      </div>
      <div class="cp-row">
        <span class="cp-key">Space</span>
        <span class="cp-blue">${algo.space}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      if (running) return;
      selectedAlgo = algo.id;
      algoDisplayName.textContent = algo.name;
      algoDisplayType.textContent = algo.type;
      buildAlgoGrid();
      document.querySelectorAll('.cp-card').forEach(c => {
        c.classList.toggle('cp-active', c.dataset.id === algo.id);
      });
    });

    complexityGrid.appendChild(card);
  });
}

/* ── Event Listeners ─────────────────────────────────────── */

// Size slider
sizeSlider.addEventListener('input', function () {
  sizeVal.textContent = this.value;
  if (!running) generateArray();
});

// Speed slider
speedSlider.addEventListener('input', function () {
  speedVal.textContent = this.value + '×';
});

// Sort button
sortBtn.addEventListener('click', () => {
  if (!running) runSort();
});

// Generate new array
genBtn.addEventListener('click', () => {
  if (!running) generateArray();
});

// Stop button
stopBtn.addEventListener('click', () => {
  stopped = true;
});

// Sound toggle
soundBtn.addEventListener('click', function () {
  soundOn = !soundOn;
  this.classList.toggle('on', soundOn);
  $('soundIcon').textContent = soundOn ? '♪' : '♪';
  $('soundLabel').textContent = soundOn ? 'Sound' : 'Muted';
  if (soundOn) initAudio();
});

// Type filter tabs
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    buildAlgoGrid();
  });
});

/* ── Keyboard Shortcuts ──────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (running) stopped = true;
    else runSort();
  }
  if (e.key === 'r' || e.key === 'R') {
    if (!running) generateArray();
  }
  if (e.key === 'm' || e.key === 'M') {
    soundOn = !soundOn;
    soundBtn.classList.toggle('on', soundOn);
    $('soundLabel').textContent = soundOn ? 'Sound' : 'Muted';
  }
});

/* ── Init ────────────────────────────────────────────────── */
function init() {
  buildAlgoGrid();
  buildComplexityGrid();
  generateArray();

  // Set initial display
  const initial = ALGOS.find(a => a.id === selectedAlgo);
  algoDisplayName.textContent = initial.name;
  algoDisplayType.textContent = initial.type;

  // Keyboard shortcut hint
  console.log(
    '%c Sorting Visualizer\n%c Shortcuts: Space = sort/stop | R = new array | M = mute',
    'font-size:16px;font-weight:bold;color:#7c3aed',
    'color:#06b6d4'
  );
}

init();