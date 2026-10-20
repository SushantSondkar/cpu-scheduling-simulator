/**
 * ui.js - User Interface Controller & Visualizations
 * CPU Scheduling Algorithm Simulator | Problem Statement 55
 *
 * Fully vanilla JS, zero dependencies, zero DOM-polluting globals except window.Sched.
 */

(function () {
  'use strict';

  // Process Palette (Consistent, high-contrast, accessible)
  const PROCESS_COLORS = [
    '#0891b2', // Cyan
    '#6366f1', // Indigo
    '#d97706', // Amber
    '#059669', // Emerald
    '#e11d48', // Rose
    '#7c3aed', // Violet
    '#0284c7', // Sky
    '#ea580c', // Orange
    '#14b8a6', // Teal
    '#ec4899'  // Pink
  ];

  function getProcessColor(pid) {
    if (!pid || pid === 'IDLE') return '#334155';
    // Hash pid to a color index deterministically
    let hash = 0;
    const str = String(pid);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % PROCESS_COLORS.length;
    return PROCESS_COLORS[idx];
  }

  // Application State
  const state = {
    processes: [],
    quantum: 3,
    lowerIsHigher: true,
    results: null,
    activeTab: 'tab-input',
    activeDetailAlgo: 'srtf',
    dryRun: {
      algoId: 'srtf',
      stepIndex: 0,
      isPlaying: false,
      timerId: null,
      speedMs: 700
    }
  };

  // DOM Elements Cache
  const el = {};

  function initDomElements() {
    el.themeToggle = document.getElementById('btn-theme-toggle');
    el.themeIcon = document.getElementById('theme-icon');
    el.exportCsv = document.getElementById('btn-export-csv');
    el.printBtn = document.getElementById('btn-print');

    el.navTabs = document.querySelectorAll('.nav-tab-btn');
    el.tabPanels = document.querySelectorAll('.tab-panel');

    el.procsTableBody = document.getElementById('procs-table-body');
    el.btnAddProcess = document.getElementById('btn-add-process');
    el.btnClearTable = document.getElementById('btn-clear-table');
    el.presetSelect = document.getElementById('preset-select');
    el.presetDesc = document.getElementById('preset-description');
    el.btnLoadPreset = document.getElementById('btn-load-preset');
    el.btnRandomSet = document.getElementById('btn-random-set');

    el.inputQuantum = document.getElementById('input-quantum');
    el.toggleLowerIsHigher = document.getElementById('toggle-lower-is-higher');
    el.priorityToggleLabel = document.getElementById('priority-toggle-label');
    el.predictionSelect = document.getElementById('prediction-select');
    el.predictionFeedback = document.getElementById('prediction-feedback');

    el.inputErrorBox = document.getElementById('input-error-box');
    el.errorList = document.getElementById('error-list');
    el.btnRunAll = document.getElementById('btn-run-all');

    // Comparison Tab Elements
    el.winnerBanner = document.getElementById('winner-banner');
    el.winnerTitle = document.getElementById('winner-title');
    el.winnerSubtitle = document.getElementById('winner-subtitle');
    el.winnerAvgTatBadge = document.getElementById('winner-avg-tat-badge');
    el.svgTatChart = document.getElementById('svg-tat-chart');
    el.leaderboardBody = document.getElementById('leaderboard-body');
    el.matrixHeadRow = document.getElementById('matrix-head-row');
    el.matrixBody = document.getElementById('matrix-body');

    // Detail Tab Elements
    el.algoSubtabs = document.getElementById('algo-subtabs');
    el.detailAlgoTitle = document.getElementById('detail-algo-title');
    el.detailAlgoTag = document.getElementById('detail-algo-tag');
    el.btnJumpDryrun = document.getElementById('btn-jump-dryrun');
    el.detailMetricChips = document.getElementById('detail-metric-chips');
    el.detailGanttTrack = document.getElementById('detail-gantt-track');
    el.detailGanttAxis = document.getElementById('detail-gantt-axis');
    el.detailProcessTbody = document.getElementById('detail-process-tbody');
    el.detailProcessTfoot = document.getElementById('detail-process-tfoot');
    el.detailCalcBox = document.getElementById('detail-calc-box');

    // Dry Run Tab Elements
    el.dryAlgoSelect = document.getElementById('dryrun-algo-select');
    el.btnDryReset = document.getElementById('btn-dry-reset');
    el.btnDryPrev = document.getElementById('btn-dry-prev');
    el.btnDryPlay = document.getElementById('btn-dry-play');
    el.btnDryNext = document.getElementById('btn-dry-next');
    el.playIcon = document.getElementById('play-icon');
    el.playText = document.getElementById('play-text');
    el.dryStepIndicator = document.getElementById('dry-step-indicator');
    el.drySpeedSlider = document.getElementById('dry-speed-slider');
    el.drySpeedLabel = document.getElementById('dry-speed-label');
    el.dryGanttTrack = document.getElementById('dryrun-gantt-track');
    el.dryGanttAxis = document.getElementById('dryrun-gantt-axis');
    el.dryRunningChip = document.getElementById('dry-running-chip');
    el.dryEventBadge = document.getElementById('dry-event-badge');
    el.dryReasonText = document.getElementById('dry-reason-text');
    el.dryQueueList = document.getElementById('dry-queue-list');
    el.dryArrivalNote = document.getElementById('dry-arrival-note');
    el.dryBurstsGrid = document.getElementById('dry-bursts-grid');
    el.dryAuditTbody = document.getElementById('dry-audit-tbody');

    el.tooltip = document.getElementById('app-tooltip');
  }

  // =========================================================================
  // THEME MANAGEMENT
  // =========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('cpu_sched_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    el.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cpu_sched_theme', next);
      updateThemeIcon(next);
      if (state.results) {
        renderComparisonChart(state.results.comparison);
      }
    });
  }

  function updateThemeIcon(theme) {
    el.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    el.themeToggle.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`;
  }

  // =========================================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================================
  function initNavigation() {
    el.navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Accordion for Theory Tab
    document.querySelectorAll('.theory-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.parentElement;
        const content = card.querySelector('.theory-content');
        const arrow = header.querySelector('span:last-child');
        const isOpen = content.style.display !== 'none';
        content.style.display = isOpen ? 'none' : 'block';
        arrow.textContent = isOpen ? '▶' : '▼';
      });
    });
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    el.navTabs.forEach(b => {
      const isMatch = b.getAttribute('data-tab') === tabId;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    el.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
      panel.style.display = panel.id === tabId ? 'block' : 'none';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-draw chart on tab switch to ensure correct dimensions
    if (tabId === 'tab-comparison' && state.results) {
      renderComparisonChart(state.results.comparison);
    }
  }

  // =========================================================================
  // INPUT TABLE & PRESETS
  // =========================================================================
  function loadPreset(key) {
    const preset = Sched.PRESETS[key] || Sched.PRESETS.classic;
    state.processes = JSON.parse(JSON.stringify(preset.processes));
    state.quantum = preset.quantum || 3;
    state.lowerIsHigher = preset.lowerIsHigher !== false;

    el.inputQuantum.value = state.quantum;
    el.toggleLowerIsHigher.checked = state.lowerIsHigher;
    updatePriorityToggleLabel();

    if (el.presetDesc) {
      el.presetDesc.textContent = preset.description || '';
    }

    renderInputTable();
    clearErrors();
  }

  function updatePriorityToggleLabel() {
    el.priorityToggleLabel.textContent = el.toggleLowerIsHigher.checked
      ? 'Lower number = Higher priority (e.g. 1 > 2)'
      : 'Higher number = Higher priority (e.g. 10 > 1)';
  }

  function renderInputTable() {
    el.procsTableBody.innerHTML = '';
    state.processes.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <input type="text" class="table-input pid-input" data-idx="${idx}" value="${escapeHtml(p.pid)}" placeholder="P${idx + 1}">
        </td>
        <td>
          <input type="number" class="table-input at-input" data-idx="${idx}" value="${p.at}" min="0" step="1">
        </td>
        <td>
          <input type="number" class="table-input bt-input" data-idx="${idx}" value="${p.bt}" min="1" step="1">
        </td>
        <td>
          <input type="number" class="table-input pr-input" data-idx="${idx}" value="${p.pr !== undefined ? p.pr : 1}" step="1">
        </td>
        <td style="text-align: center;">
          <button class="btn btn-danger btn-sm btn-delete-row" data-idx="${idx}" title="Remove Process">🗑️</button>
        </td>
      `;
      el.procsTableBody.appendChild(tr);
    });

    attachInputRowEvents();
  }

  function attachInputRowEvents() {
    // Input change handlers
    el.procsTableBody.querySelectorAll('.table-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (e.target.classList.contains('pid-input')) {
          state.processes[idx].pid = e.target.value;
        } else if (e.target.classList.contains('at-input')) {
          state.processes[idx].at = e.target.value === '' ? '' : Number(e.target.value);
        } else if (e.target.classList.contains('bt-input')) {
          state.processes[idx].bt = e.target.value === '' ? '' : Number(e.target.value);
        } else if (e.target.classList.contains('pr-input')) {
          state.processes[idx].pr = e.target.value === '' ? '' : Number(e.target.value);
        }
        liveValidate();
      });
    });

    // Delete row buttons
    el.procsTableBody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (state.processes.length <= 1) {
          showErrors(['At least one process must remain in the set.']);
          return;
        }
        state.processes.splice(idx, 1);
        renderInputTable();
        liveValidate();
      });
    });
  }

  function addProcessRow() {
    // Find next unused PID number
    let nextNum = state.processes.length + 1;
    while (state.processes.some(p => p.pid === `P${nextNum}`)) {
      nextNum++;
    }
    state.processes.push({
      pid: `P${nextNum}`,
      at: 0,
      bt: 4,
      pr: 1
    });
    renderInputTable();
    liveValidate();
  }

  function clearInputTable() {
    state.processes = [{ pid: 'P1', at: 0, bt: 4, pr: 1 }];
    renderInputTable();
    liveValidate();
  }

  function generateRandomSet() {
    const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 processes
    const newProcs = [];
    for (let i = 1; i <= count; i++) {
      newProcs.push({
        pid: `P${i}`,
        at: i === 1 ? 0 : Math.floor(Math.random() * 8),
        bt: Math.floor(Math.random() * 8) + 2,
        pr: Math.floor(Math.random() * 5) + 1
      });
    }
    state.processes = newProcs;
    renderInputTable();
    clearErrors();
  }

  // =========================================================================
  // INPUT VALIDATION
  // =========================================================================
  function liveValidate() {
    const q = Number(el.inputQuantum.value);
    const validation = Sched.validateInput(state.processes, { quantum: q });

    // Clear previous input-error classes
    el.procsTableBody.querySelectorAll('.table-input').forEach(input => {
      input.classList.remove('input-error');
    });

    if (!validation.valid) {
      showErrors(validation.errors);
      highlightErrorInputs();
      return false;
    } else {
      clearErrors();
      return true;
    }
  }

  function highlightErrorInputs() {
    const seenPids = new Map();
    state.processes.forEach((p, idx) => {
      const pidStr = String(p.pid || '').trim();
      if (!seenPids.has(pidStr)) {
        seenPids.set(pidStr, []);
      }
      seenPids.get(pidStr).push(idx);

      const row = el.procsTableBody.children[idx];
      if (!row) return;

      const pidInput = row.querySelector('.pid-input');
      const atInput = row.querySelector('.at-input');
      const btInput = row.querySelector('.bt-input');
      const prInput = row.querySelector('.pr-input');

      if (!pidStr) pidInput.classList.add('input-error');
      if (p.at === '' || isNaN(Number(p.at)) || !Number.isInteger(Number(p.at)) || Number(p.at) < 0) {
        atInput.classList.add('input-error');
      }
      if (p.bt === '' || isNaN(Number(p.bt)) || !Number.isInteger(Number(p.bt)) || Number(p.bt) <= 0) {
        btInput.classList.add('input-error');
      }
      if (p.pr !== '' && (isNaN(Number(p.pr)) || !Number.isInteger(Number(p.pr)))) {
        prInput.classList.add('input-error');
      }
    });

    // Mark duplicate PIDs
    seenPids.forEach((indices, pidStr) => {
      if (indices.length > 1 && pidStr) {
        indices.forEach(idx => {
          const row = el.procsTableBody.children[idx];
          if (row) row.querySelector('.pid-input').classList.add('input-error');
        });
      }
    });
  }

  function showErrors(errors) {
    el.errorList.innerHTML = '';
    errors.forEach(err => {
      const li = document.createElement('li');
      li.textContent = err;
      el.errorList.appendChild(li);
    });
    el.inputErrorBox.style.display = 'block';
  }

  function clearErrors() {
    el.inputErrorBox.style.display = 'none';
    el.errorList.innerHTML = '';
  }

  // =========================================================================
  // SIMULATION EXECUTION & RESULTS DISPATCH
  // =========================================================================
  function runSimulation() {
    const q = Number(el.inputQuantum.value);
    const lowerIsHigher = el.toggleLowerIsHigher.checked;

    state.quantum = q;
    state.lowerIsHigher = lowerIsHigher;

    if (!liveValidate()) {
      switchTab('tab-input');
      return;
    }

    try {
      const results = Sched.runAll(state.processes, {
        quantum: q,
        lowerIsHigher: lowerIsHigher
      });

      state.results = results;

      // Render all views
      renderWinnerBanner(results);
      renderPredictionFeedback(results);
      renderComparisonChart(results.comparison);
      renderLeaderboard(results.comparison);
      renderMatrixTable(results);
      renderDetailedAlgorithm(state.activeDetailAlgo);
      initDryRun(state.dryRun.algoId || 'srtf');

      // Switch to Comparison Tab (Problem Statement 55 Focus)
      switchTab('tab-comparison');
    } catch (err) {
      showErrors([err.message]);
    }
  }

  // =========================================================================
  // TAB 2: COMPARISON RENDERING (CORE OF PS 55)
  // =========================================================================
  function renderWinnerBanner(results) {
    const bestList = results.bestAlgorithms.join(' & ');
    const bestTat = results.bestAvgTat.toFixed(2);
    const worstTat = Math.max(...results.comparison.map(c => c.avgTat)).toFixed(2);
    const diff = (worstTat - bestTat).toFixed(2);

    el.winnerTitle.textContent = `🏆 Best by Average TAT: ${bestList} (${bestTat} units)`;
    el.winnerSubtitle.textContent = results.bestAlgorithms.length > 1
      ? `Tied for 1st place! Achieved the minimum average turnaround time across all test algorithms.`
      : `Outperformed the slowest algorithm by ${diff} time units, minimizing overall process completion wait time.`;
    el.winnerAvgTatBadge.textContent = `Lowest Avg TAT: ${bestTat}`;
  }

  function renderPredictionFeedback(results) {
    const userGuess = el.predictionSelect.value;
    const algoMap = {
      fcfs: 'FCFS',
      sjf: 'SJF',
      srtf: 'SRTF',
      priorityNp: `Priority (${state.lowerIsHigher ? 'Lower=High' : 'Higher=High'})`,
      priorityP: `Priority (${state.lowerIsHigher ? 'Lower=High' : 'Higher=High'})`,
      rr: `Round Robin (q=${state.quantum})`
    };

    const isWinner = results.comparison.some(c => c.id === userGuess && c.isBest);
    const guessedName = algoMap[userGuess] || userGuess;
    const bestNames = results.bestAlgorithms.join(' or ');

    if (isWinner) {
      el.predictionFeedback.className = 'prediction-result correct';
      el.predictionFeedback.innerHTML = `
        <strong>🎉 Accurate Prediction!</strong> You predicted <strong>${escapeHtml(guessedName)}</strong>, which achieved the lowest average TAT of <strong>${results.bestAvgTat.toFixed(2)}</strong>!
        <br><span style="font-size: 0.8rem; opacity: 0.9;">SRTF is mathematically optimal for minimizing average turnaround and waiting times when burst times are known.</span>
      `;
    } else {
      el.predictionFeedback.className = 'prediction-result incorrect';
      el.predictionFeedback.innerHTML = `
        <strong>💡 Learning Opportunity:</strong> You predicted <strong>${escapeHtml(guessedName)}</strong>, but <strong>${escapeHtml(bestNames)}</strong> achieved the lowest average TAT (<strong>${results.bestAvgTat.toFixed(2)}</strong> vs your choice's ${(results[userGuess]?.avgTat || 0).toFixed(2)}).
        <br><span style="font-size: 0.8rem; opacity: 0.9;">SRTF/SJF minimizes average waiting times by running short jobs first, removing them from the ready queue quickly.</span>
      `;
    }
  }

  // Pure handwritten SVG Bar Chart
  function renderComparisonChart(comparison) {
    const svg = el.svgTatChart;
    svg.innerHTML = '';

    const width = 850;
    const height = 300;
    const padLeft = 70;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 65;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxTat = Math.max(...comparison.map(c => c.avgTat), 1);
    // Round upper limit up to nice tick
    const yMax = Math.ceil(maxTat * 1.2);

    // Draw Grid lines & Y-axis labels
    const numYTicks = 5;
    for (let i = 0; i <= numYTicks; i++) {
      const val = (yMax / numYTicks) * i;
      const y = padTop + chartH - (val / yMax) * chartH;

      // Line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padLeft);
      line.setAttribute('x2', width - padRight);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'var(--border-color)');
      line.setAttribute('stroke-dasharray', i === 0 ? '0' : '4 4');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      // Label
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', padLeft - 10);
      txt.setAttribute('y', y + 4);
      txt.setAttribute('text-anchor', 'end');
      txt.setAttribute('font-size', '11');
      txt.setAttribute('fill', 'var(--text-dim)');
      txt.setAttribute('font-family', 'var(--font-mono)');
      txt.textContent = val.toFixed(1);
      svg.appendChild(txt);
    }

    // Y Axis Title
    const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yTitle.setAttribute('transform', `rotate(-90)`);
    yTitle.setAttribute('x', -(padTop + chartH / 2));
    yTitle.setAttribute('y', 18);
    yTitle.setAttribute('text-anchor', 'middle');
    yTitle.setAttribute('font-size', '11');
    yTitle.setAttribute('font-weight', '600');
    yTitle.setAttribute('fill', 'var(--text-muted)');
    yTitle.textContent = 'Avg Turnaround Time (TAT)';
    svg.appendChild(yTitle);

    // Render Bars
    const barCount = comparison.length;
    const barWidth = Math.min(65, (chartW / barCount) * 0.65);
    const gap = chartW / barCount;

    comparison.forEach((item, idx) => {
      const x = padLeft + idx * gap + (gap - barWidth) / 2;
      const barH = (item.avgTat / yMax) * chartH;
      const y = padTop + chartH - barH;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', Math.max(barH, 2));
      rect.setAttribute('rx', '4');
      rect.setAttribute('class', `chart-bar ${item.isBest ? 'is-best' : ''}`);
      rect.setAttribute('fill', item.isBest ? 'var(--winner-gold)' : (idx % 2 === 0 ? '#38bdf8' : '#818cf8'));

      // Hover Tooltip
      rect.addEventListener('mouseenter', (e) => {
        showTooltip(e, `
          <strong>${escapeHtml(item.name)}</strong> (${item.tag})<br>
          Avg TAT: <strong>${item.avgTat.toFixed(2)}</strong> units<br>
          Avg WT: ${item.avgWt.toFixed(2)} | Context Switches: ${item.contextSwitches}
        `);
      });
      rect.addEventListener('mousemove', moveTooltip);
      rect.addEventListener('mouseleave', hideTooltip);

      // Click to inspect
      rect.addEventListener('click', () => {
        selectDetailAlgo(item.id);
        switchTab('tab-details');
      });

      svg.appendChild(rect);

      // Top Value Label
      const valLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valLabel.setAttribute('x', x + barWidth / 2);
      valLabel.setAttribute('y', y - 7);
      valLabel.setAttribute('text-anchor', 'middle');
      valLabel.setAttribute('font-size', '12');
      valLabel.setAttribute('font-weight', '700');
      valLabel.setAttribute('font-family', 'var(--font-mono)');
      valLabel.setAttribute('fill', item.isBest ? 'var(--winner-gold)' : 'var(--text-main)');
      valLabel.textContent = item.avgTat.toFixed(2);
      svg.appendChild(valLabel);

      if (item.isBest) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x + barWidth / 2);
        star.setAttribute('y', y - 22);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('font-size', '14');
        star.textContent = '★';
        svg.appendChild(star);
      }

      // Bottom Category Label
      const catLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      catLabel.setAttribute('x', x + barWidth / 2);
      catLabel.setAttribute('y', padTop + chartH + 18);
      catLabel.setAttribute('text-anchor', 'middle');
      catLabel.setAttribute('font-size', '11');
      catLabel.setAttribute('font-weight', '600');
      catLabel.setAttribute('fill', 'var(--text-main)');
      catLabel.textContent = item.id.toUpperCase();
      svg.appendChild(catLabel);

      // Sub-label (tag)
      const subLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subLabel.setAttribute('x', x + barWidth / 2);
      subLabel.setAttribute('y', padTop + chartH + 34);
      subLabel.setAttribute('text-anchor', 'middle');
      subLabel.setAttribute('font-size', '9.5');
      subLabel.setAttribute('fill', 'var(--text-dim)');
      subLabel.textContent = item.tag === 'Preemptive' ? 'Preemptive' : 'Non-Preempt';
      svg.appendChild(subLabel);
    });
  }

  function renderLeaderboard(comparison) {
    el.leaderboardBody.innerHTML = '';
    comparison.forEach(item => {
      const tr = document.createElement('tr');
      if (item.isBest) {
        tr.style.backgroundColor = 'var(--winner-bg)';
      }

      const rankClass = item.rank === 1 ? 'rank-1' : (item.rank === 2 ? 'rank-2' : (item.rank === 3 ? 'rank-3' : ''));

      tr.innerHTML = `
        <td>
          <span class="rank-badge ${rankClass}">
            ${item.rank}
          </span>
        </td>
        <td>
          <strong>${escapeHtml(item.name)}</strong>
          ${item.isBest ? ' <span class="winner-badge" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">BEST</span>' : ''}
        </td>
        <td>
          <span class="badge" style="font-size: 0.75rem; color: ${item.tag === 'Preemptive' ? 'var(--accent-rose)' : 'var(--accent-blue)'};">
            ${escapeHtml(item.tag)}
          </span>
        </td>
        <td>
          <strong style="color: ${item.isBest ? 'var(--winner-gold)' : 'var(--text-main)'}; font-family: var(--font-mono); font-size: 0.95rem;">
            ${item.avgTat.toFixed(2)}
          </strong>
        </td>
        <td style="font-family: var(--font-mono);">${item.avgWt.toFixed(2)}</td>
        <td style="font-family: var(--font-mono);">${item.contextSwitches}</td>
        <td style="font-family: var(--font-mono);">${item.cpuUtilization.toFixed(1)}%</td>
        <td style="font-family: var(--font-mono);">${item.throughput.toFixed(3)}</td>
      `;

      tr.style.cursor = 'pointer';
      tr.title = 'Click to inspect Gantt chart & step audit';
      tr.addEventListener('click', () => {
        selectDetailAlgo(item.id);
        switchTab('tab-details');
      });

      el.leaderboardBody.appendChild(tr);
    });
  }

  function renderMatrixTable(results) {
    el.matrixBody.innerHTML = '';
    const procs = state.processes;

    procs.forEach(p => {
      const tatFcfs = results.fcfs.perProcess[p.pid]?.tat ?? '-';
      const tatSjf = results.sjf.perProcess[p.pid]?.tat ?? '-';
      const tatSrtf = results.srtf.perProcess[p.pid]?.tat ?? '-';
      const tatPnp = results.priorityNp.perProcess[p.pid]?.tat ?? '-';
      const tatPp = results.priorityP.perProcess[p.pid]?.tat ?? '-';
      const tatRr = results.rr.perProcess[p.pid]?.tat ?? '-';

      const validTats = [tatFcfs, tatSjf, tatSrtf, tatPnp, tatPp, tatRr].filter(v => typeof v === 'number');
      const minTat = validTats.length > 0 ? Math.min(...validTats) : -1;

      function formatVal(v) {
        if (typeof v !== 'number') return '-';
        if (v === minTat) {
          return `<strong style="color: var(--accent-emerald); background: rgba(16, 185, 129, 0.12); padding: 0.15rem 0.4rem; border-radius: 4px;">${v} ★</strong>`;
        }
        return v;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: ${getProcessColor(p.pid)};">${escapeHtml(p.pid)}</strong></td>
        <td>${p.at}</td>
        <td>${p.bt}</td>
        <td>${p.pr !== undefined ? p.pr : 1}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatFcfs)}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatSjf)}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatSrtf)}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatPnp)}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatPp)}</td>
        <td style="font-family: var(--font-mono);">${formatVal(tatRr)}</td>
      `;
      el.matrixBody.appendChild(tr);
    });
  }

  // =========================================================================
  // TAB 3: DETAILED RESULTS & GANTT CHARTS
  // =========================================================================
  function initDetailSubtabs() {
    el.algoSubtabs.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const algo = btn.getAttribute('data-algo');
        selectDetailAlgo(algo);
      });
    });

    el.btnJumpDryrun.addEventListener('click', () => {
      el.dryAlgoSelect.value = state.activeDetailAlgo;
      initDryRun(state.activeDetailAlgo);
      switchTab('tab-dryrun');
    });
  }

  function selectDetailAlgo(algoId) {
    state.activeDetailAlgo = algoId;
    el.algoSubtabs.querySelectorAll('button').forEach(b => {
      b.classList.toggle('btn-primary', b.getAttribute('data-algo') === algoId);
      b.classList.toggle('btn-secondary', b.getAttribute('data-algo') !== algoId);
    });
    if (state.results) {
      renderDetailedAlgorithm(algoId);
    }
  }

  function renderDetailedAlgorithm(algoId) {
    if (!state.results) return;

    const data = state.results[algoId];
    if (!data) return;

    const titles = {
      fcfs: { title: 'First-Come, First-Served (FCFS)', tag: 'Non-Preemptive • Arrived processes ordered by arrival time, then PID' },
      sjf: { title: 'Shortest Job First (SJF)', tag: 'Non-Preemptive • Pick shortest burst among arrived; ties broken by arrival then PID' },
      srtf: { title: 'Shortest Remaining Time First (SRTF)', tag: 'Preemptive • Pick shortest remaining burst; ties do NOT preempt; lower PID tie-break' },
      priorityNp: { title: `Priority Scheduling (${state.lowerIsHigher ? 'Lower=Higher' : 'Higher=Higher'})`, tag: 'Non-Preemptive • Highest priority process runs to completion' },
      priorityP: { title: `Priority Scheduling (${state.lowerIsHigher ? 'Lower=Higher' : 'Higher=Higher'})`, tag: 'Preemptive • Preempts only on strictly higher priority candidate' },
      rr: { title: `Round Robin (Time Quantum = ${state.quantum})`, tag: 'Preemptive • New arrivals enqueued before preempted processes on simultaneous boundary' }
    };

    el.detailAlgoTitle.textContent = titles[algoId]?.title || algoId.toUpperCase();
    el.detailAlgoTag.textContent = titles[algoId]?.tag || '';

    // Metric Chips
    el.detailMetricChips.innerHTML = `
      <div class="metric-chip">
        <span class="metric-chip-label">Avg Turnaround</span>
        <span class="metric-chip-val highlight">${data.avgTat.toFixed(2)}</span>
      </div>
      <div class="metric-chip">
        <span class="metric-chip-label">Avg Waiting</span>
        <span class="metric-chip-val">${data.avgWt.toFixed(2)}</span>
      </div>
      <div class="metric-chip">
        <span class="metric-chip-label">Avg Response</span>
        <span class="metric-chip-val">${data.avgRt.toFixed(2)}</span>
      </div>
      <div class="metric-chip">
        <span class="metric-chip-label">Context Switches</span>
        <span class="metric-chip-val">${data.contextSwitches}</span>
      </div>
      <div class="metric-chip">
        <span class="metric-chip-label">CPU Utilization</span>
        <span class="metric-chip-val">${data.cpuUtilization.toFixed(1)}%</span>
      </div>
      <div class="metric-chip">
        <span class="metric-chip-label">Throughput</span>
        <span class="metric-chip-val">${data.throughput.toFixed(3)}/unit</span>
      </div>
    `;

    // Render Gantt Chart
    renderGanttChart(data.gantt, data.totalTime, el.detailGanttTrack, el.detailGanttAxis);

    // Process Table
    renderProcessTable(data.perProcess);

    // Calculation Breakdown
    const pids = Object.keys(data.perProcess);
    const tatList = pids.map(p => data.perProcess[p].tat);
    const wtList = pids.map(p => data.perProcess[p].wt);
    const rtList = pids.map(p => data.perProcess[p].rt);
    const sumTat = tatList.reduce((a, b) => a + b, 0);
    const sumWt = wtList.reduce((a, b) => a + b, 0);
    const sumRt = rtList.reduce((a, b) => a + b, 0);
    const n = pids.length;

    el.detailCalcBox.innerHTML = `
      <div><strong>Average Turnaround Time (TAT) Calculation:</strong></div>
      <div>Σ TAT / N = (${tatList.join(' + ')}) / ${n} = ${sumTat} / ${n} = <strong>${data.avgTat.toFixed(2)} units</strong></div>
      <div style="margin-top: 0.4rem;"><strong>Average Waiting Time (WT) Calculation:</strong></div>
      <div>Σ WT / N = (${wtList.join(' + ')}) / ${n} = ${sumWt} / ${n} = <strong>${data.avgWt.toFixed(2)} units</strong></div>
      <div style="margin-top: 0.4rem;"><strong>Average Response Time (RT) Calculation:</strong></div>
      <div>Σ RT / N = (${rtList.join(' + ')}) / ${n} = ${sumRt} / ${n} = <strong>${data.avgRt.toFixed(2)} units</strong></div>
      <div style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-dim);">
        * Context Switches: ${data.contextSwitches} (Counted strictly when transitioning between distinct real processes. IDLE periods do not count.)
      </div>
    `;
  }

  function renderGanttChart(gantt, totalTime, trackEl, axisEl) {
    trackEl.innerHTML = '';
    axisEl.innerHTML = '';

    if (!gantt || gantt.length === 0 || totalTime === 0) return;

    // Build timeline boundary set for axis ticks
    const timeTicks = new Set([0]);

    gantt.forEach(block => {
      const duration = block.end - block.start;
      const widthPct = (duration / totalTime) * 100;
      timeTicks.add(block.start);
      timeTicks.add(block.end);

      const div = document.createElement('div');
      div.className = `gantt-block ${block.pid === 'IDLE' ? 'idle' : ''}`;
      div.style.width = `${widthPct}%`;
      div.style.backgroundColor = block.pid === 'IDLE' ? '' : getProcessColor(block.pid);

      div.innerHTML = `
        <span>${escapeHtml(block.pid)}</span>
        <span class="gantt-duration">${duration}u</span>
      `;

      if (block.preempted) {
        const marker = document.createElement('div');
        marker.className = 'preemption-marker';
        marker.title = 'Preemption Occurred Here';
        div.appendChild(marker);
      }

      // Tooltip
      div.addEventListener('mouseenter', (e) => {
        showTooltip(e, `
          <strong>${escapeHtml(block.pid)}</strong><br>
          Start: ${block.start} | End: ${block.end}<br>
          Duration: ${duration} units ${block.preempted ? '<br><span style="color:var(--accent-rose);">⚡ Preempted</span>' : ''}
        `);
      });
      div.addEventListener('mousemove', moveTooltip);
      div.addEventListener('mouseleave', hideTooltip);

      trackEl.appendChild(div);
    });

    // Time Axis Ticks
    Array.from(timeTicks).sort((a, b) => a - b).forEach(t => {
      const leftPct = (t / totalTime) * 100;
      const tick = document.createElement('div');
      tick.className = 'gantt-axis-tick';
      tick.style.left = `${leftPct}%`;
      tick.textContent = t;
      axisEl.appendChild(tick);
    });
  }

  function renderProcessTable(perProcess) {
    el.detailProcessTbody.innerHTML = '';
    const pids = Object.keys(perProcess).sort(Sched.comparePid);

    let sumAt = 0, sumBt = 0, sumCt = 0, sumTat = 0, sumWt = 0, sumRt = 0;

    pids.forEach(pid => {
      const p = perProcess[pid];
      sumAt += p.at;
      sumBt += p.bt;
      sumCt += p.ct;
      sumTat += p.tat;
      sumWt += p.wt;
      sumRt += p.rt;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: ${getProcessColor(p.pid)};">${escapeHtml(p.pid)}</strong></td>
        <td>${p.at}</td>
        <td>${p.bt}</td>
        <td>${p.pr}</td>
        <td style="font-family: var(--font-mono);">${p.ct}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-blue);">${p.tat}</td>
        <td style="font-family: var(--font-mono);">${p.wt}</td>
        <td style="font-family: var(--font-mono);">${p.rt}</td>
      `;
      el.detailProcessTbody.appendChild(tr);
    });

    const n = pids.length;
    el.detailProcessTfoot.innerHTML = `
      <tr>
        <td><strong>Totals & Averages</strong></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td style="color: var(--accent-blue);"><strong>Avg: ${(sumTat / n).toFixed(2)}</strong></td>
        <td><strong>Avg: ${(sumWt / n).toFixed(2)}</strong></td>
        <td><strong>Avg: ${(sumRt / n).toFixed(2)}</strong></td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 4: STEP-BY-STEP DRY RUN INSPECTOR
  // =========================================================================
  function initDryRunControls() {
    el.dryAlgoSelect.addEventListener('change', () => {
      initDryRun(el.dryAlgoSelect.value);
    });

    el.btnDryReset.addEventListener('click', () => {
      pauseDryRun();
      state.dryRun.stepIndex = 0;
      updateDryRunUI();
    });

    el.btnDryPrev.addEventListener('click', () => {
      pauseDryRun();
      if (state.dryRun.stepIndex > 0) {
        state.dryRun.stepIndex--;
        updateDryRunUI();
      }
    });

    el.btnDryNext.addEventListener('click', () => {
      pauseDryRun();
      advanceDryRunStep();
    });

    el.btnDryPlay.addEventListener('click', () => {
      if (state.dryRun.isPlaying) {
        pauseDryRun();
      } else {
        startDryRun();
      }
    });

    el.drySpeedSlider.addEventListener('input', (e) => {
      // Invert value so higher slider = faster
      const raw = Number(e.target.value);
      state.dryRun.speedMs = 1700 - raw;
      if (raw >= 1200) el.drySpeedLabel.textContent = 'Very Fast';
      else if (raw >= 800) el.drySpeedLabel.textContent = 'Fast';
      else if (raw >= 500) el.drySpeedLabel.textContent = 'Normal';
      else el.drySpeedLabel.textContent = 'Slow';

      if (state.dryRun.isPlaying) {
        pauseDryRun();
        startDryRun();
      }
    });
  }

  function initDryRun(algoId) {
    pauseDryRun();
    state.dryRun.algoId = algoId;
    state.dryRun.stepIndex = 0;
    el.dryAlgoSelect.value = algoId;
    updateDryRunUI();
  }

  function startDryRun() {
    state.dryRun.isPlaying = true;
    el.playIcon.textContent = '⏸';
    el.playText.textContent = 'Pause';
    state.dryRun.timerId = setInterval(() => {
      const data = state.results ? state.results[state.dryRun.algoId] : null;
      if (!data || !data.steps || state.dryRun.stepIndex >= data.steps.length - 1) {
        pauseDryRun();
        return;
      }
      advanceDryRunStep();
    }, state.dryRun.speedMs);
  }

  function pauseDryRun() {
    state.dryRun.isPlaying = false;
    el.playIcon.textContent = '▶';
    el.playText.textContent = 'Play';
    if (state.dryRun.timerId) {
      clearInterval(state.dryRun.timerId);
      state.dryRun.timerId = null;
    }
  }

  function advanceDryRunStep() {
    const data = state.results ? state.results[state.dryRun.algoId] : null;
    if (!data || !data.steps) return;
    if (state.dryRun.stepIndex < data.steps.length - 1) {
      state.dryRun.stepIndex++;
      updateDryRunUI();
    } else {
      pauseDryRun();
    }
  }

  function updateDryRunUI() {
    if (!state.results) return;
    const data = state.results[state.dryRun.algoId];
    if (!data || !data.steps || data.steps.length === 0) return;

    const idx = Math.min(state.dryRun.stepIndex, data.steps.length - 1);
    const step = data.steps[idx];

    // Indicator
    el.dryStepIndicator.textContent = `Step ${idx + 1} of ${data.steps.length} (Clock Time t = ${step.time})`;

    // Running Chip & Event Badge
    if (step.running && step.running !== 'IDLE') {
      el.dryRunningChip.className = 'running-chip';
      el.dryRunningChip.style.backgroundColor = getProcessColor(step.running);
      el.dryRunningChip.innerHTML = `<span>▶</span> <span>${escapeHtml(step.running)}</span>`;
    } else {
      el.dryRunningChip.className = 'running-chip idle';
      el.dryRunningChip.style.backgroundColor = 'var(--border-color)';
      el.dryRunningChip.innerHTML = `<span>💤</span> <span>CPU IDLE</span>`;
    }

    el.dryEventBadge.textContent = step.event;
    el.dryReasonText.textContent = step.reason;

    // Ready Queue Badges
    el.dryQueueList.innerHTML = '';
    if (step.readyQueue && step.readyQueue.length > 0) {
      step.readyQueue.forEach((pid, qIdx) => {
        const badge = document.createElement('span');
        badge.className = 'queue-badge';
        badge.style.backgroundColor = getProcessColor(pid);
        badge.textContent = `${qIdx + 1}. ${pid}`;
        el.dryQueueList.appendChild(badge);
      });
    } else {
      el.dryQueueList.innerHTML = `<span class="queue-badge empty-state">Ready Queue is empty</span>`;
    }

    // Arrivals Note
    if (step.arrived && step.arrived.length > 0) {
      el.dryArrivalNote.textContent = `⚡ Arrivals at t=${step.time}: ${step.arrived.join(', ')}`;
      el.dryArrivalNote.style.color = 'var(--accent-blue)';
    } else {
      el.dryArrivalNote.textContent = `Arrivals at this instant: None`;
      el.dryArrivalNote.style.color = 'var(--text-dim)';
    }

    // Remaining Bursts Bars
    el.dryBurstsGrid.innerHTML = '';
    state.processes.forEach(p => {
      const rem = step.remaining[p.pid] !== undefined ? step.remaining[p.pid] : p.bt;
      const pct = Math.max(0, Math.min(100, (rem / p.bt) * 100));

      const div = document.createElement('div');
      div.className = 'burst-bar-item';
      div.innerHTML = `
        <div class="burst-bar-label">
          <strong style="color: ${getProcessColor(p.pid)};">${escapeHtml(p.pid)}</strong>
          <span>${rem}/${p.bt}</span>
        </div>
        <div class="burst-progress-bg">
          <div class="burst-progress-fill" style="width: ${pct}%; background-color: ${rem === 0 ? 'var(--text-dim)' : getProcessColor(p.pid)};"></div>
        </div>
      `;
      el.dryBurstsGrid.appendChild(div);
    });

    // Synchronized Gantt Chart revealed up to current step.time
    renderDryRunGantt(data.gantt, data.totalTime, step.time);

    // Audit Log Table
    renderAuditLog(data.steps, idx);
  }

  function renderDryRunGantt(fullGantt, totalTime, currentTime) {
    el.dryGanttTrack.innerHTML = '';
    el.dryGanttAxis.innerHTML = '';

    if (!fullGantt || totalTime === 0) return;

    // Filter gantt blocks up to current time
    const visibleBlocks = [];
    fullGantt.forEach(b => {
      if (b.start < currentTime) {
        const segEnd = Math.min(b.end, currentTime);
        visibleBlocks.push({
          pid: b.pid,
          start: b.start,
          end: segEnd,
          preempted: segEnd === b.end ? b.preempted : false
        });
      }
    });

    const timeTicks = new Set([0, currentTime, totalTime]);

    visibleBlocks.forEach(block => {
      const duration = block.end - block.start;
      const widthPct = (duration / totalTime) * 100;
      timeTicks.add(block.start);
      timeTicks.add(block.end);

      const div = document.createElement('div');
      div.className = `gantt-block ${block.pid === 'IDLE' ? 'idle' : ''}`;
      div.style.width = `${widthPct}%`;
      div.style.backgroundColor = block.pid === 'IDLE' ? '' : getProcessColor(block.pid);
      div.innerHTML = `<span>${escapeHtml(block.pid)}</span>`;

      el.dryGanttTrack.appendChild(div);
    });

    // Ghost remaining width
    if (currentTime < totalTime) {
      const remainingPct = ((totalTime - currentTime) / totalTime) * 100;
      const ghost = document.createElement('div');
      ghost.style.width = `${remainingPct}%`;
      ghost.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
      ghost.style.border = '1px dashed var(--border-color)';
      ghost.style.height = '100%';
      el.dryGanttTrack.appendChild(ghost);
    }

    // Ticks
    Array.from(timeTicks).sort((a, b) => a - b).forEach(t => {
      const leftPct = (t / totalTime) * 100;
      const tick = document.createElement('div');
      tick.className = 'gantt-axis-tick';
      tick.style.left = `${leftPct}%`;
      tick.textContent = t;
      el.dryGanttAxis.appendChild(tick);
    });
  }

  function renderAuditLog(steps, currentIdx) {
    el.dryAuditTbody.innerHTML = '';
    // Show around current step
    steps.forEach((s, i) => {
      const tr = document.createElement('tr');
      if (i === currentIdx) {
        tr.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
        tr.style.fontWeight = '700';
      }
      tr.innerHTML = `
        <td style="font-family: var(--font-mono);">${s.time}</td>
        <td>${escapeHtml(s.event)}</td>
        <td><strong style="color: ${getProcessColor(s.running)};">${escapeHtml(s.running || '-')}</strong></td>
        <td>${s.readyQueue && s.readyQueue.length > 0 ? s.readyQueue.join(', ') : '-'}</td>
      `;
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        pauseDryRun();
        state.dryRun.stepIndex = i;
        updateDryRunUI();
      });
      el.dryAuditTbody.appendChild(tr);
    });

    // Auto-scroll to active row
    const activeRow = el.dryAuditTbody.children[currentIdx];
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'nearest' });
    }
  }

  // =========================================================================
  // EXPORT TO CSV
  // =========================================================================
  function exportResultsCsv() {
    if (!state.results) {
      alert('Please run the simulation first before exporting.');
      return;
    }

    const res = state.results;
    let csv = [];

    csv.push('CPU SCHEDULING ALGORITHM SIMULATOR - REPORT');
    csv.push(`Generated: ${new Date().toLocaleString()}`);
    csv.push(`Problem Statement: 55 - Compare Average Turnaround Times`);
    csv.push('');

    // Input Set
    csv.push('INPUT PROCESS SET');
    csv.push('PID,Arrival Time,Burst Time,Priority');
    state.processes.forEach(p => {
      csv.push(`${p.pid},${p.at},${p.bt},${p.pr !== undefined ? p.pr : 1}`);
    });
    csv.push(`Round Robin Quantum: ${state.quantum}`);
    csv.push(`Priority Convention: ${state.lowerIsHigher ? 'Lower Number = Higher Priority' : 'Higher Number = Higher Priority'}`);
    csv.push('');

    // Summary Comparison
    csv.push('ALGORITHM COMPARISON & RANKINGS (Problem Statement 55)');
    csv.push('Rank,Algorithm,Type,Avg Turnaround Time,Avg Waiting Time,Avg Response Time,Context Switches,CPU Utilization (%),Throughput (proc/unit)');
    res.comparison.forEach(c => {
      csv.push(`${c.rank},"${c.name}",${c.tag},${c.avgTat.toFixed(2)},${c.avgWt.toFixed(2)},${c.avgRt.toFixed(2)},${c.contextSwitches},${c.cpuUtilization.toFixed(1)}%,${c.throughput.toFixed(4)}`);
    });
    csv.push('');

    // Detailed Per-Process Table for each algorithm
    const algos = [
      { id: 'fcfs', name: 'FCFS' },
      { id: 'sjf', name: 'SJF (Non-Preemptive)' },
      { id: 'srtf', name: 'SRTF (Preemptive)' },
      { id: 'priorityNp', name: 'Priority (Non-Preemptive)' },
      { id: 'priorityP', name: 'Priority (Preemptive)' },
      { id: 'rr', name: 'Round Robin' }
    ];

    algos.forEach(a => {
      const data = res[a.id];
      csv.push(`DETAILED METRICS: ${a.name}`);
      csv.push('PID,Arrival Time,Burst Time,Priority,Completion Time,Turnaround Time,Waiting Time,Response Time');
      Object.keys(data.perProcess).sort(Sched.comparePid).forEach(pid => {
        const p = data.perProcess[pid];
        csv.push(`${p.pid},${p.at},${p.bt},${p.pr},${p.ct},${p.tat},${p.wt},${p.rt}`);
      });
      csv.push(`,,,,Avg TAT:,${data.avgTat.toFixed(2)},Avg WT:,${data.avgWt.toFixed(2)}`);
      csv.push('');
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cpu_scheduling_simulation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // TOOLTIP HELPERS
  // =========================================================================
  function showTooltip(e, htmlContent) {
    el.tooltip.innerHTML = htmlContent;
    el.tooltip.style.opacity = '1';
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    el.tooltip.style.left = `${x}px`;
    el.tooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    el.tooltip.style.opacity = '0';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    initDomElements();
    initTheme();
    initNavigation();
    initDetailSubtabs();
    initDryRunControls();

    // Event Listeners
    el.btnAddProcess.addEventListener('click', addProcessRow);
    el.btnClearTable.addEventListener('click', clearInputTable);
    el.btnLoadPreset.addEventListener('click', () => loadPreset(el.presetSelect.value));
    el.presetSelect.addEventListener('change', () => loadPreset(el.presetSelect.value));
    el.btnRandomSet.addEventListener('click', generateRandomSet);
    el.toggleLowerIsHigher.addEventListener('change', updatePriorityToggleLabel);
    el.btnRunAll.addEventListener('click', runSimulation);
    el.exportCsv.addEventListener('click', exportResultsCsv);
    el.printBtn.addEventListener('click', () => window.print());

    // Load Default Classic Test Set
    loadPreset('classic');

    // Run simulation automatically on launch so student immediately sees full charts & leaderboards
    runSimulation();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
