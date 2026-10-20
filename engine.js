/**
 * engine.js - Pure CPU Scheduling Engine
 * Operating Systems Coursework - Problem Statement 55
 *
 * ZERO DOM access. Works in both browser (window.Sched) and Node (module.exports).
 * Strictly implements tie-breaking rules, context-switch rules, and step-by-step audit.
 */

(function () {
  'use strict';

  // Natural PID comparator: 'P1' < 'P2' < 'P10'
  function comparePid(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  // Clone processes deeply and normalize inputs
  function normalizeProcesses(procs) {
    if (!Array.isArray(procs)) return [];
    return procs.map(p => ({
      pid: p.pid !== undefined && p.pid !== null ? String(p.pid).trim() : '',
      at: Number(p.at),
      bt: Number(p.bt),
      pr: p.pr !== undefined && p.pr !== null && String(p.pr).trim() !== '' ? Number(p.pr) : 1
    }));
  }

  /**
   * Validate process list and options
   */
  function validateInput(procs, options = {}) {
    const opts = options || {};
    const errors = [];
    if (!Array.isArray(procs) || procs.length === 0) {
      errors.push('At least one process must be entered.');
      return { valid: false, errors };
    }

    const seenPids = new Set();
    procs.forEach((p, idx) => {
      const rowNum = idx + 1;
      const pid = p.pid !== undefined && p.pid !== null ? String(p.pid).trim() : '';
      if (!pid) {
        errors.push(`Row ${rowNum}: Process ID (PID) cannot be empty.`);
      } else if (pid.toUpperCase() === 'IDLE') {
        errors.push(`Row ${rowNum}: Process ID "${pid}" is reserved for CPU idle time.`);
      } else if (seenPids.has(pid)) {
        errors.push(`Duplicate PID "${pid}" found at Row ${rowNum}. PIDs must be unique.`);
      } else {
        seenPids.add(pid);
      }

      if (p.at === '' || p.at === undefined || p.at === null || isNaN(Number(p.at)) || !Number.isInteger(Number(p.at))) {
        errors.push(`Row ${rowNum} (${pid || 'unnamed'}): Arrival Time must be an integer.`);
      } else if (Number(p.at) < 0) {
        errors.push(`Row ${rowNum} (${pid || 'unnamed'}): Arrival Time must be >= 0.`);
      }

      if (p.bt === '' || p.bt === undefined || p.bt === null || isNaN(Number(p.bt)) || !Number.isInteger(Number(p.bt))) {
        errors.push(`Row ${rowNum} (${pid || 'unnamed'}): Burst Time must be an integer.`);
      } else if (Number(p.bt) <= 0) {
        errors.push(`Row ${rowNum} (${pid || 'unnamed'}): Burst Time must be >= 1.`);
      }

      if (p.pr !== undefined && p.pr !== '' && p.pr !== null) {
        if (isNaN(Number(p.pr)) || !Number.isInteger(Number(p.pr))) {
          errors.push(`Row ${rowNum} (${pid || 'unnamed'}): Priority must be an integer.`);
        }
      }
    });

    const q = opts.quantum;
    if (q !== undefined && q !== null) {
      if (isNaN(Number(q)) || !Number.isInteger(Number(q)) || Number(q) < 1) {
        errors.push('Round Robin Time Quantum must be an integer >= 1.');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper to merge contiguous execution units into gantt blocks
   * rawUnits: [{pid: 'P1'|'IDLE', time: t, preempted?: boolean}]
   */
  function buildGanttFromUnits(rawUnits) {
    if (!rawUnits || rawUnits.length === 0) return [];
    const gantt = [];
    let current = {
      pid: rawUnits[0].pid,
      start: rawUnits[0].time,
      end: rawUnits[0].time + 1,
      preempted: false
    };

    for (let i = 1; i < rawUnits.length; i++) {
      const u = rawUnits[i];
      if (u.pid === current.pid) {
        current.end = u.time + 1;
      } else {
        if (current.pid !== 'IDLE' && rawUnits[i - 1].preempted) {
          current.preempted = true;
        }
        gantt.push(current);
        current = {
          pid: u.pid,
          start: u.time,
          end: u.time + 1,
          preempted: false
        };
      }
    }
    if (current.pid !== 'IDLE' && rawUnits[rawUnits.length - 1].preempted) {
      current.preempted = true;
    }
    gantt.push(current);
    return gantt;
  }

  /**
   * Calculate Context Switches
   * "Context switches: count only when the CPU moves from one real process to a DIFFERENT process
   *  (not at start, not at end, idle gaps are not counted as processes)."
   */
  function countContextSwitches(gantt) {
    const realSegments = gantt.filter(g => g.pid !== 'IDLE');
    let switches = 0;
    for (let i = 0; i < realSegments.length - 1; i++) {
      if (realSegments[i].pid !== realSegments[i + 1].pid) {
        switches++;
      }
    }
    return switches;
  }

  /**
   * Finalize and compute metrics
   */
  function finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps) {
    const gantt = buildGanttFromUnits(rawUnits);
    const contextSwitches = countContextSwitches(gantt);

    const totalTime = rawUnits.length > 0 ? rawUnits[rawUnits.length - 1].time + 1 : 0;
    let totalBusy = 0;
    rawUnits.forEach(u => {
      if (u.pid !== 'IDLE') totalBusy++;
    });

    const perProcess = {};
    let sumTat = 0;
    let sumWt = 0;
    let sumRt = 0;

    procs.forEach(p => {
      const ct = completionTimeMap[p.pid] !== undefined ? completionTimeMap[p.pid] : p.at;
      const tat = ct - p.at;
      const wt = tat - p.bt;
      const firstCpu = firstCpuTimeMap[p.pid] !== undefined ? firstCpuTimeMap[p.pid] : p.at;
      const rt = firstCpu - p.at;

      perProcess[p.pid] = {
        pid: p.pid,
        at: p.at,
        bt: p.bt,
        pr: p.pr,
        ct,
        tat,
        wt,
        rt,
        firstCpuTime: firstCpu
      };

      sumTat += tat;
      sumWt += wt;
      sumRt += rt;
    });

    const n = procs.length;
    const avgTat = n > 0 ? Number((sumTat / n).toFixed(2)) : 0;
    const avgWt = n > 0 ? Number((sumWt / n).toFixed(2)) : 0;
    const avgRt = n > 0 ? Number((sumRt / n).toFixed(2)) : 0;

    const cpuUtilization = totalTime > 0 ? Number(((totalBusy / totalTime) * 100).toFixed(2)) : 0;
    const throughput = totalTime > 0 ? Number((n / totalTime).toFixed(4)) : 0;

    return {
      gantt,
      perProcess,
      avgTat,
      avgWt,
      avgRt,
      contextSwitches,
      cpuUtilization,
      throughput,
      totalTime,
      steps
    };
  }

  // Snapshot remaining bursts for step audit
  function snapshotRemaining(procs, remainingMap) {
    const res = {};
    procs.forEach(p => {
      res[p.pid] = remainingMap[p.pid] !== undefined ? remainingMap[p.pid] : p.bt;
    });
    return res;
  }

  // =========================================================================
  // 1. FIRST-COME, FIRST-SERVED (FCFS)
  // Strict rule: order by arrival time, then lower PID.
  // =========================================================================
  function fcfs(rawProcs, options = {}) {
    const procs = normalizeProcesses(rawProcs);
    const sorted = [...procs].sort((a, b) => {
      if (a.at !== b.at) return a.at - b.at;
      return comparePid(a.pid, b.pid);
    });

    const rawUnits = [];
    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const steps = [];
    let currentTime = 0;
    let procIndex = 0;

    while (procIndex < sorted.length) {
      const p = sorted[procIndex];

      // Handle Idle time if process arrives in the future
      if (currentTime < p.at) {
        const idleStart = currentTime;
        while (currentTime < p.at) {
          const arrivedThisUnit = sorted.filter(x => x.at === currentTime).map(x => x.pid);
          steps.push({
            time: currentTime,
            event: 'CPU Idle',
            arrived: arrivedThisUnit,
            readyQueue: [],
            running: 'IDLE',
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `No process has arrived yet at t=${currentTime}. CPU is IDLE waiting for next arrival at t=${p.at}.`
          });
          rawUnits.push({ pid: 'IDLE', time: currentTime });
          currentTime++;
        }
      }

      // Process starts/resumes
      firstCpuTimeMap[p.pid] = currentTime;
      const readyQueuePids = sorted.slice(procIndex + 1).filter(x => x.at <= currentTime).map(x => x.pid);
      const arrivedAtStart = sorted.filter(x => x.at === currentTime).map(x => x.pid);

      steps.push({
        time: currentTime,
        event: 'Process Dispatched',
        arrived: arrivedAtStart,
        readyQueue: readyQueuePids,
        running: p.pid,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${p.pid} arrived at t=${p.at} and is dispatched (FCFS: earliest arrival, tie-break by PID).`
      });

      // Run process to completion
      for (let b = 0; b < p.bt; b++) {
        const t = currentTime;
        remainingMap[p.pid]--;
        rawUnits.push({ pid: p.pid, time: t });

        // Record any arrivals occurring while running
        const arrivedThisSec = sorted.filter(x => x.at === t && x.pid !== p.pid).map(x => x.pid);
        const currentReady = sorted.slice(procIndex + 1).filter(x => x.at <= t).map(x => x.pid);

        if (b > 0) {
          steps.push({
            time: t,
            event: 'Execution Step',
            arrived: arrivedThisSec,
            readyQueue: currentReady,
            running: p.pid,
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `${p.pid} continues executing (remaining burst: ${remainingMap[p.pid]}).`
          });
        }
        currentTime++;
      }

      completionTimeMap[p.pid] = currentTime;
      const readyAfterFinish = sorted.slice(procIndex + 1).filter(x => x.at <= currentTime).map(x => x.pid);
      steps.push({
        time: currentTime,
        event: 'Process Completed',
        arrived: sorted.filter(x => x.at === currentTime).map(x => x.pid),
        readyQueue: readyAfterFinish,
        running: null,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${p.pid} completed execution at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - p.at}).`
      });

      procIndex++;
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // 2. SHORTEST JOB FIRST (SJF - Non-Preemptive)
  // Strict rule: among arrived processes, pick smallest burst;
  // ties by earlier arrival, then lower PID. Runs non-preemptively.
  // =========================================================================
  function sjf(rawProcs, options = {}) {
    const procs = normalizeProcesses(rawProcs);
    const n = procs.length;
    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const completedSet = new Set();
    const rawUnits = [];
    const steps = [];

    let currentTime = 0;

    while (completedSet.size < n) {
      // Find arrived and uncompleted processes
      const available = procs.filter(p => p.at <= currentTime && !completedSet.has(p.pid));

      if (available.length === 0) {
        // CPU is IDLE
        const nextArrival = Math.min(...procs.filter(p => !completedSet.has(p.pid)).map(p => p.at));
        while (currentTime < nextArrival) {
          const arrivedNow = procs.filter(p => p.at === currentTime).map(p => p.pid);
          steps.push({
            time: currentTime,
            event: 'CPU Idle',
            arrived: arrivedNow,
            readyQueue: [],
            running: 'IDLE',
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `Ready queue is empty at t=${currentTime}. CPU is IDLE until next arrival at t=${nextArrival}.`
          });
          rawUnits.push({ pid: 'IDLE', time: currentTime });
          currentTime++;
        }
        continue;
      }

      // Pick smallest burst time; ties: earlier arrival, then lower PID
      available.sort((a, b) => {
        if (a.bt !== b.bt) return a.bt - b.bt;
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const chosen = available[0];
      const readyQueuePids = available.slice(1).map(x => x.pid);
      const arrivedAtStart = procs.filter(x => x.at === currentTime && !completedSet.has(x.pid)).map(x => x.pid);

      firstCpuTimeMap[chosen.pid] = currentTime;

      steps.push({
        time: currentTime,
        event: 'Process Dispatched',
        arrived: arrivedAtStart,
        readyQueue: readyQueuePids,
        running: chosen.pid,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${chosen.pid} selected (smallest burst=${chosen.bt}${available.length > 1 ? `, beat ${available.slice(1).map(x => `${x.pid}(BT=${x.bt})`).join(', ')}` : ''}). Non-preemptive execution begins.`
      });

      // Run chosen to completion
      for (let b = 0; b < chosen.bt; b++) {
        const t = currentTime;
        remainingMap[chosen.pid]--;
        rawUnits.push({ pid: chosen.pid, time: t });

        const arrivedNow = procs.filter(x => x.at === t && x.pid !== chosen.pid && !completedSet.has(x.pid)).map(x => x.pid);
        const currentReady = procs.filter(x => x.at <= t && x.pid !== chosen.pid && !completedSet.has(x.pid)).map(x => x.pid);

        if (b > 0) {
          steps.push({
            time: t,
            event: 'Execution Step',
            arrived: arrivedNow,
            readyQueue: currentReady,
            running: chosen.pid,
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `${chosen.pid} executing non-preemptively (remaining: ${remainingMap[chosen.pid]}).`
          });
        }
        currentTime++;
      }

      completedSet.add(chosen.pid);
      completionTimeMap[chosen.pid] = currentTime;

      const readyAfterFinish = procs.filter(x => x.at <= currentTime && !completedSet.has(x.pid)).map(x => x.pid);
      steps.push({
        time: currentTime,
        event: 'Process Completed',
        arrived: procs.filter(x => x.at === currentTime && !completedSet.has(x.pid)).map(x => x.pid),
        readyQueue: readyAfterFinish,
        running: null,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${chosen.pid} finished execution at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - chosen.at}, WT=${currentTime - chosen.at - chosen.bt}).`
      });
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // 3. SHORTEST REMAINING TIME FIRST (SRTF - Preemptive SJF)
  // Strict rule: at every time unit pick smallest remaining time;
  // if equal to the running process, do NOT preempt;
  // other ties by earlier arrival then lower PID.
  // =========================================================================
  function srtf(rawProcs, options = {}) {
    const procs = normalizeProcesses(rawProcs);
    const n = procs.length;
    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const completedSet = new Set();
    const rawUnits = [];
    const steps = [];

    let currentTime = 0;
    let runningPid = null;

    while (completedSet.size < n) {
      const arrivedThisTick = procs.filter(p => p.at === currentTime && !completedSet.has(p.pid)).map(p => p.pid);
      const available = procs.filter(p => p.at <= currentTime && !completedSet.has(p.pid));

      if (available.length === 0) {
        steps.push({
          time: currentTime,
          event: 'CPU Idle',
          arrived: arrivedThisTick,
          readyQueue: [],
          running: 'IDLE',
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `No processes ready at t=${currentTime}. CPU is IDLE.`
        });
        rawUnits.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        runningPid = null;
        continue;
      }

      // Sort ready queue: remaining time ASC, arrival time ASC, PID ASC
      available.sort((a, b) => {
        const remA = remainingMap[a.pid];
        const remB = remainingMap[b.pid];
        if (remA !== remB) return remA - remB;
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const bestCandidate = available[0];
      let selected = bestCandidate;
      let decisionReason = '';

      if (runningPid && !completedSet.has(runningPid)) {
        const runningRem = remainingMap[runningPid];
        const bestRem = remainingMap[bestCandidate.pid];

        if (bestCandidate.pid !== runningPid) {
          // Rule: "if equal to the running process, do NOT preempt"
          if (bestRem < runningRem) {
            // Strictly smaller remaining time: PREEMPT!
            decisionReason = `PREEMPTION! ${bestCandidate.pid} has smaller remaining time (${bestRem} < ${runningRem} of running ${runningPid}). ${runningPid} is preempted.`;
            // Mark last unit as preempted
            if (rawUnits.length > 0 && rawUnits[rawUnits.length - 1].pid === runningPid) {
              rawUnits[rawUnits.length - 1].preempted = true;
            }
            selected = bestCandidate;
          } else {
            // Equal or larger: do NOT preempt running process
            selected = procs.find(p => p.pid === runningPid);
            decisionReason = `${runningPid} retains CPU. Best candidate ${bestCandidate.pid} has rem=${bestRem} which does not strictly beat running rem=${runningRem} (non-preemption on tie).`;
          }
        } else {
          decisionReason = `${runningPid} continues executing (smallest remaining time: ${runningRem}).`;
        }
      } else {
        // CPU was idle or previous process completed
        decisionReason = `${selected.pid} dispatched with smallest remaining time (${remainingMap[selected.pid]}).`;
      }

      if (firstCpuTimeMap[selected.pid] === undefined) {
        firstCpuTimeMap[selected.pid] = currentTime;
      }

      runningPid = selected.pid;
      const readyQueuePids = available.filter(x => x.pid !== runningPid).map(x => x.pid);

      steps.push({
        time: currentTime,
        event: selected.pid !== (rawUnits.length > 0 ? rawUnits[rawUnits.length - 1].pid : null) ? 'Process Dispatched' : 'Execution Step',
        arrived: arrivedThisTick,
        readyQueue: readyQueuePids,
        running: runningPid,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: decisionReason
      });

      // Execute 1 unit
      rawUnits.push({ pid: runningPid, time: currentTime });
      remainingMap[runningPid]--;
      currentTime++;

      // Check completion
      if (remainingMap[runningPid] === 0) {
        completedSet.add(runningPid);
        completionTimeMap[runningPid] = currentTime;

        const nextArrived = procs.filter(p => p.at === currentTime && !completedSet.has(p.pid)).map(p => p.pid);
        const readyAfterFinish = procs.filter(x => x.at <= currentTime && !completedSet.has(x.pid)).map(x => x.pid);

        steps.push({
          time: currentTime,
          event: 'Process Completed',
          arrived: nextArrived,
          readyQueue: readyAfterFinish,
          running: null,
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `${runningPid} completed at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - procs.find(p => p.pid === runningPid).at}).`
        });

        runningPid = null;
      }
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // Helper for Priority Comparison
  // lowerIsHigher (default: true): 1 is higher priority than 2.
  // =========================================================================
  function isHigherPriority(prA, prB, lowerIsHigher) {
    return lowerIsHigher ? prA < prB : prA > prB;
  }

  // =========================================================================
  // 4. PRIORITY SCHEDULING (Non-Preemptive)
  // Strict rule: user toggle "lower number = higher priority" (default ON).
  // Ties by earlier arrival then lower PID. Runs non-preemptively to completion.
  // =========================================================================
  function priorityNonPreemptive(rawProcs, options = {}) {
    const opts = options || {};
    const procs = normalizeProcesses(rawProcs);
    const lowerIsHigher = opts.lowerIsHigher !== false; // default true
    const n = procs.length;

    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const completedSet = new Set();
    const rawUnits = [];
    const steps = [];

    let currentTime = 0;

    while (completedSet.size < n) {
      const available = procs.filter(p => p.at <= currentTime && !completedSet.has(p.pid));

      if (available.length === 0) {
        const nextArrival = Math.min(...procs.filter(p => !completedSet.has(p.pid)).map(p => p.at));
        while (currentTime < nextArrival) {
          const arrivedNow = procs.filter(p => p.at === currentTime).map(p => p.pid);
          steps.push({
            time: currentTime,
            event: 'CPU Idle',
            arrived: arrivedNow,
            readyQueue: [],
            running: 'IDLE',
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `No arrived processes at t=${currentTime}. CPU is IDLE until t=${nextArrival}.`
          });
          rawUnits.push({ pid: 'IDLE', time: currentTime });
          currentTime++;
        }
        continue;
      }

      // Sort by priority (higher first), ties by arrival time ASC, then PID ASC
      available.sort((a, b) => {
        if (a.pr !== b.pr) {
          return isHigherPriority(a.pr, b.pr, lowerIsHigher) ? -1 : 1;
        }
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const chosen = available[0];
      firstCpuTimeMap[chosen.pid] = currentTime;
      const readyQueuePids = available.slice(1).map(x => x.pid);
      const arrivedAtStart = procs.filter(x => x.at === currentTime && !completedSet.has(x.pid)).map(x => x.pid);

      steps.push({
        time: currentTime,
        event: 'Process Dispatched',
        arrived: arrivedAtStart,
        readyQueue: readyQueuePids,
        running: chosen.pid,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${chosen.pid} selected (highest priority: ${chosen.pr}${available.length > 1 ? `, competing against ${available.slice(1).map(x => `${x.pid}(Pr=${x.pr})`).join(', ')}` : ''}). Non-preemptive execution.`
      });

      // Run to completion
      for (let b = 0; b < chosen.bt; b++) {
        const t = currentTime;
        remainingMap[chosen.pid]--;
        rawUnits.push({ pid: chosen.pid, time: t });

        const arrivedNow = procs.filter(x => x.at === t && x.pid !== chosen.pid && !completedSet.has(x.pid)).map(x => x.pid);
        const currentReady = procs.filter(x => x.at <= t && x.pid !== chosen.pid && !completedSet.has(x.pid)).map(x => x.pid);

        if (b > 0) {
          steps.push({
            time: t,
            event: 'Execution Step',
            arrived: arrivedNow,
            readyQueue: currentReady,
            running: chosen.pid,
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `${chosen.pid} running non-preemptively (remaining: ${remainingMap[chosen.pid]}).`
          });
        }
        currentTime++;
      }

      completedSet.add(chosen.pid);
      completionTimeMap[chosen.pid] = currentTime;

      const readyAfterFinish = procs.filter(x => x.at <= currentTime && !completedSet.has(x.pid)).map(x => x.pid);
      steps.push({
        time: currentTime,
        event: 'Process Completed',
        arrived: procs.filter(x => x.at === currentTime && !completedSet.has(x.pid)).map(x => x.pid),
        readyQueue: readyAfterFinish,
        running: null,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: `${chosen.pid} completed at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - chosen.at}, WT=${currentTime - chosen.at - chosen.bt}).`
      });
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // 5. PRIORITY SCHEDULING (Preemptive)
  // Strict rule: at every time unit, preempts ONLY if an arrived process has
  // strictly higher priority than the running process. Does NOT preempt on equal priority.
  // Ties broken by earlier arrival then lower PID.
  // =========================================================================
  function priorityPreemptive(rawProcs, options = {}) {
    const opts = options || {};
    const procs = normalizeProcesses(rawProcs);
    const lowerIsHigher = opts.lowerIsHigher !== false; // default true
    const n = procs.length;

    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const completedSet = new Set();
    const rawUnits = [];
    const steps = [];

    let currentTime = 0;
    let runningPid = null;

    while (completedSet.size < n) {
      const arrivedThisTick = procs.filter(p => p.at === currentTime && !completedSet.has(p.pid)).map(p => p.pid);
      const available = procs.filter(p => p.at <= currentTime && !completedSet.has(p.pid));

      if (available.length === 0) {
        steps.push({
          time: currentTime,
          event: 'CPU Idle',
          arrived: arrivedThisTick,
          readyQueue: [],
          running: 'IDLE',
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `No processes ready at t=${currentTime}. CPU is IDLE.`
        });
        rawUnits.push({ pid: 'IDLE', time: currentTime });
        currentTime++;
        runningPid = null;
        continue;
      }

      // Sort candidate pool by priority (highest first), then arrival time ASC, then PID ASC
      available.sort((a, b) => {
        if (a.pr !== b.pr) {
          return isHigherPriority(a.pr, b.pr, lowerIsHigher) ? -1 : 1;
        }
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const bestCandidate = available[0];
      let selected = bestCandidate;
      let decisionReason = '';

      if (runningPid && !completedSet.has(runningPid)) {
        const runningProc = procs.find(p => p.pid === runningPid);

        if (bestCandidate.pid !== runningPid) {
          // Rule: preempt only if candidate has STRICTLY higher priority
          if (isHigherPriority(bestCandidate.pr, runningProc.pr, lowerIsHigher)) {
            decisionReason = `PREEMPTION! ${bestCandidate.pid} (Priority ${bestCandidate.pr}) has strictly higher priority than running ${runningPid} (Priority ${runningProc.pr}). ${runningPid} preempted.`;
            if (rawUnits.length > 0 && rawUnits[rawUnits.length - 1].pid === runningPid) {
              rawUnits[rawUnits.length - 1].preempted = true;
            }
            selected = bestCandidate;
          } else {
            // Equal priority or lower priority -> DO NOT PREEMPT
            selected = runningProc;
            decisionReason = `${runningPid} retains CPU. Best candidate ${bestCandidate.pid} (Priority ${bestCandidate.pr}) does not strictly beat running Priority ${runningProc.pr} (no preemption on equal priority).`;
          }
        } else {
          decisionReason = `${runningPid} continues executing (highest priority ${runningProc.pr}).`;
        }
      } else {
        decisionReason = `${selected.pid} dispatched with highest priority (${selected.pr}).`;
      }

      if (firstCpuTimeMap[selected.pid] === undefined) {
        firstCpuTimeMap[selected.pid] = currentTime;
      }

      runningPid = selected.pid;
      const readyQueuePids = available.filter(x => x.pid !== runningPid).map(x => x.pid);

      steps.push({
        time: currentTime,
        event: selected.pid !== (rawUnits.length > 0 ? rawUnits[rawUnits.length - 1].pid : null) ? 'Process Dispatched' : 'Execution Step',
        arrived: arrivedThisTick,
        readyQueue: readyQueuePids,
        running: runningPid,
        remaining: snapshotRemaining(procs, remainingMap),
        reason: decisionReason
      });

      // Execute 1 unit
      rawUnits.push({ pid: runningPid, time: currentTime });
      remainingMap[runningPid]--;
      currentTime++;

      // Check completion
      if (remainingMap[runningPid] === 0) {
        completedSet.add(runningPid);
        completionTimeMap[runningPid] = currentTime;

        const nextArrived = procs.filter(p => p.at === currentTime && !completedSet.has(p.pid)).map(p => p.pid);
        const readyAfterFinish = procs.filter(x => x.at <= currentTime && !completedSet.has(x.pid)).map(x => x.pid);

        steps.push({
          time: currentTime,
          event: 'Process Completed',
          arrived: nextArrived,
          readyQueue: readyAfterFinish,
          running: null,
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `${runningPid} completed at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - procs.find(p => p.pid === runningPid).at}).`
        });

        runningPid = null;
      }
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // 6. ROUND ROBIN (RR)
  // Strict rule:
  // - User-defined Time Quantum (default 3, min 1).
  // - When a new arrival and a preempted process hit the queue at the SAME instant,
  //   the NEW ARRIVAL is enqueued first, then the preempted process.
  // - If the ready queue is empty and processes have not arrived, CPU goes IDLE.
  // =========================================================================
  function roundRobin(rawProcs, options = {}) {
    const opts = options || {};
    const procs = normalizeProcesses(rawProcs);
    const quantum = opts.quantum ? Math.max(1, Math.floor(Number(opts.quantum))) : 3;
    const n = procs.length;

    const remainingMap = {};
    procs.forEach(p => remainingMap[p.pid] = p.bt);

    const firstCpuTimeMap = {};
    const completionTimeMap = {};
    const completedSet = new Set();
    const rawUnits = [];
    const steps = [];

    // Ready Queue stores PIDs
    let readyQueue = [];
    // Keep track of which processes have arrived into the system
    const arrivedSet = new Set();

    let currentTime = 0;
    let runningPid = null;
    let currentSliceUsed = 0;

    // Helper to check new arrivals at exact time t
    function getNewArrivalsAt(t) {
      const arrived = procs
        .filter(p => p.at === t && !arrivedSet.has(p.pid))
        .sort((a, b) => comparePid(a.pid, b.pid));
      arrived.forEach(p => arrivedSet.add(p.pid));
      return arrived.map(p => p.pid);
    }

    // Step 0: Check arrivals at t=0
    const initialArrivals = getNewArrivalsAt(0);
    initialArrivals.forEach(pid => readyQueue.push(pid));

    while (completedSet.size < n) {
      // 1. If no process is currently running
      if (!runningPid) {
        if (readyQueue.length === 0) {
          // Ready queue is empty, but some processes haven't arrived yet -> CPU is IDLE
          const unarrived = procs.filter(p => !arrivedSet.has(p.pid));
          if (unarrived.length > 0) {
            steps.push({
              time: currentTime,
              event: 'CPU Idle',
              arrived: [],
              readyQueue: [],
              running: 'IDLE',
              remaining: snapshotRemaining(procs, remainingMap),
              reason: `Ready queue is empty at t=${currentTime}. CPU is IDLE.`
            });
            rawUnits.push({ pid: 'IDLE', time: currentTime });
            currentTime++;

            // Check arrivals at new time
            const arrivalsAtT = getNewArrivalsAt(currentTime);
            arrivalsAtT.forEach(pid => readyQueue.push(pid));
            continue;
          }
        }

        // Dispatch next from ready queue
        if (readyQueue.length > 0) {
          runningPid = readyQueue.shift();
          currentSliceUsed = 0;
          if (firstCpuTimeMap[runningPid] === undefined) {
            firstCpuTimeMap[runningPid] = currentTime;
          }

          steps.push({
            time: currentTime,
            event: 'Process Dispatched',
            arrived: [],
            readyQueue: [...readyQueue],
            running: runningPid,
            remaining: snapshotRemaining(procs, remainingMap),
            reason: `${runningPid} dequeued from ready queue and dispatched with time quantum = ${quantum}.`
          });
        }
      }

      // 2. Execute 1 time unit of runningPid
      const t = currentTime;
      rawUnits.push({ pid: runningPid, time: t });
      remainingMap[runningPid]--;
      currentSliceUsed++;
      currentTime++;

      // 3. New arrivals at the boundary currentTime
      const newArrivals = getNewArrivalsAt(currentTime);

      // 4. Check if process completed or quantum expired
      const isCompleted = remainingMap[runningPid] === 0;
      const isQuantumExpired = !isCompleted && currentSliceUsed >= quantum;

      // STRICT RULE: "when a new arrival and a preempted process hit the queue at the same instant,
      // the NEW ARRIVAL is enqueued first."
      // Add new arrivals first:
      newArrivals.forEach(pid => readyQueue.push(pid));

      if (isCompleted) {
        completedSet.add(runningPid);
        completionTimeMap[runningPid] = currentTime;

        steps.push({
          time: currentTime,
          event: 'Process Completed',
          arrived: newArrivals,
          readyQueue: [...readyQueue],
          running: null,
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `${runningPid} finished execution at t=${currentTime} (CT=${currentTime}, TAT=${currentTime - procs.find(p => p.pid === runningPid).at}).`
        });

        runningPid = null;
        currentSliceUsed = 0;
      } else if (isQuantumExpired) {
        // Mark preemption on the last unit
        if (rawUnits.length > 0) {
          rawUnits[rawUnits.length - 1].preempted = true;
        }

        // Preempted process is enqueued SECOND (after new arrivals)
        readyQueue.push(runningPid);

        steps.push({
          time: currentTime,
          event: 'Time Quantum Expired',
          arrived: newArrivals,
          readyQueue: [...readyQueue],
          running: null,
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `Quantum (${quantum}) expired for ${runningPid} (remaining burst: ${remainingMap[runningPid]}). ${newArrivals.length > 0 ? `New arrivals (${newArrivals.join(', ')}) enqueued first; then ` : ''}${runningPid} re-enqueued at tail.`
        });

        runningPid = null;
        currentSliceUsed = 0;
      } else {
        // Process continues running next unit
        steps.push({
          time: currentTime,
          event: 'Execution Step',
          arrived: newArrivals,
          readyQueue: [...readyQueue],
          running: runningPid,
          remaining: snapshotRemaining(procs, remainingMap),
          reason: `${runningPid} continuing execution (${currentSliceUsed}/${quantum} of quantum used, remaining burst: ${remainingMap[runningPid]}).`
        });
      }
    }

    return finalizeMetrics(procs, rawUnits, firstCpuTimeMap, completionTimeMap, steps);
  }

  // =========================================================================
  // RUN ALL ALGORITHMS & COMPARISON (Problem Statement 55)
  // =========================================================================
  function runAll(rawProcs, options = {}) {
    const opts = options || {};
    const val = validateInput(rawProcs, opts);
    if (!val.valid) {
      throw new Error(val.errors.join(' '));
    }

    const lowerIsHigher = opts.lowerIsHigher !== false;
    const quantum = opts.quantum ? Math.max(1, Math.floor(Number(opts.quantum))) : 3;

    const resFcfs = fcfs(rawProcs, opts);
    const resSjf = sjf(rawProcs, opts);
    const resSrtf = srtf(rawProcs, opts);
    const resPriorityNp = priorityNonPreemptive(rawProcs, { ...opts, lowerIsHigher });
    const resPriorityP = priorityPreemptive(rawProcs, { ...opts, lowerIsHigher });
    const resRr = roundRobin(rawProcs, { ...opts, quantum });

    const rawList = [
      { id: 'fcfs', name: 'FCFS', tag: 'Non-Preemptive', res: resFcfs },
      { id: 'sjf', name: 'SJF', tag: 'Non-Preemptive', res: resSjf },
      { id: 'srtf', name: 'SRTF', tag: 'Preemptive', res: resSrtf },
      { id: 'priorityNp', name: `Priority (${lowerIsHigher ? 'Lower=High' : 'Higher=High'})`, tag: 'Non-Preemptive', res: resPriorityNp },
      { id: 'priorityP', name: `Priority (${lowerIsHigher ? 'Lower=High' : 'Higher=High'})`, tag: 'Preemptive', res: resPriorityP },
      { id: 'rr', name: `Round Robin (q=${quantum})`, tag: 'Preemptive', res: resRr }
    ];

    // Compute ranks by avgTat ascending. Ties receive the same rank!
    const sortedForRanking = [...rawList].sort((a, b) => a.res.avgTat - b.res.avgTat);
    let currentRank = 1;
    for (let i = 0; i < sortedForRanking.length; i++) {
      if (i > 0 && sortedForRanking[i].res.avgTat === sortedForRanking[i - 1].res.avgTat) {
        sortedForRanking[i].rank = sortedForRanking[i - 1].rank;
      } else {
        sortedForRanking[i].rank = currentRank;
      }
      currentRank++;
    }

    const minAvgTat = sortedForRanking[0].res.avgTat;
    const bestAlgorithms = sortedForRanking
      .filter(item => item.res.avgTat === minAvgTat)
      .map(item => item.name);

    const comparison = rawList.map(item => {
      const isBest = item.res.avgTat === minAvgTat;
      return {
        id: item.id,
        name: item.name,
        tag: item.tag,
        avgTat: item.res.avgTat,
        avgWt: item.res.avgWt,
        avgRt: item.res.avgRt,
        contextSwitches: item.res.contextSwitches,
        cpuUtilization: item.res.cpuUtilization,
        throughput: item.res.throughput,
        rank: item.rank,
        isBest
      };
    }).sort((a, b) => a.rank - b.rank);

    return {
      fcfs: resFcfs,
      sjf: resSjf,
      srtf: resSrtf,
      priorityNp: resPriorityNp,
      priorityP: resPriorityP,
      rr: resRr,
      comparison,
      bestAvgTat: minAvgTat,
      bestAlgorithms,
      options: {
        lowerIsHigher,
        quantum
      }
    };
  }

  // =========================================================================
  // PRESET EXAMPLES
  // =========================================================================
  const PRESETS = {
    classic: {
      name: 'Classic Test Set (Problem Statement 55)',
      description: 'P1(0,8,2), P2(1,4,1), P3(2,9,4), P4(3,5,3). Demonstrates SRTF superiority.',
      quantum: 3,
      lowerIsHigher: true,
      processes: [
        { pid: 'P1', at: 0, bt: 8, pr: 2 },
        { pid: 'P2', at: 1, bt: 4, pr: 1 },
        { pid: 'P3', at: 2, bt: 9, pr: 4 },
        { pid: 'P4', at: 3, bt: 5, pr: 3 }
      ]
    },
    idleGaps: {
      name: 'CPU Idle Gaps',
      description: 'Arrivals separated by gaps, testing CPU Idle intervals and context switch neutrality.',
      quantum: 3,
      lowerIsHigher: true,
      processes: [
        { pid: 'P1', at: 1, bt: 3, pr: 2 },
        { pid: 'P2', at: 7, bt: 4, pr: 1 },
        { pid: 'P3', at: 15, bt: 2, pr: 3 }
      ]
    },
    allAtZero: {
      name: 'Convoy Effect (All AT = 0)',
      description: 'Long job arrives first with smaller jobs behind it, showing FCFS convoy effect.',
      quantum: 2,
      lowerIsHigher: true,
      processes: [
        { pid: 'P1', at: 0, bt: 12, pr: 3 },
        { pid: 'P2', at: 0, bt: 2, pr: 1 },
        { pid: 'P3', at: 0, bt: 3, pr: 2 },
        { pid: 'P4', at: 0, bt: 1, pr: 4 }
      ]
    },
    heavyTies: {
      name: 'Heavy Ties (Tie-Breaking Test)',
      description: 'Identical bursts and priorities testing tie-breaking by arrival time and PID.',
      quantum: 3,
      lowerIsHigher: true,
      processes: [
        { pid: 'P1', at: 0, bt: 4, pr: 2 },
        { pid: 'P2', at: 0, bt: 4, pr: 2 },
        { pid: 'P3', at: 2, bt: 4, pr: 2 },
        { pid: 'P4', at: 2, bt: 4, pr: 2 }
      ]
    }
  };

  // Expose API
  const Sched = {
    comparePid,
    validateInput,
    fcfs,
    sjf,
    srtf,
    priorityNonPreemptive,
    priorityPreemptive,
    roundRobin,
    runAll,
    PRESETS
  };

  // Environment bindings
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sched;
  }
  if (typeof window !== 'undefined') {
    window.Sched = Sched;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.Sched = Sched;
  }
})();
