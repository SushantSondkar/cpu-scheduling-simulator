/**
 * tests/reference.js
 * Independent Reference Implementation: Naive Tick-by-Tick CPU Scheduling Simulator
 * Operating Systems Coursework - Problem Statement 55
 *
 * Designed from first principles without shortcuts or event-jumping.
 * Advances simulation time by exactly 1 unit at every step.
 * Strictly implements tie-breaking and preemption rules from specification.
 */

'use strict';

/**
 * Natural PID comparator: 'P1' < 'P2' < 'P10'
 */
function comparePid(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Normalize and clone input processes
 */
function normalizeProcesses(rawProcs) {
  if (!Array.isArray(rawProcs)) return [];
  return rawProcs.map(p => ({
    pid: p.pid !== undefined && p.pid !== null ? String(p.pid).trim() : '',
    at: Number(p.at),
    bt: Number(p.bt),
    pr: p.pr !== undefined && p.pr !== null && String(p.pr).trim() !== '' ? Number(p.pr) : 1
  }));
}

/**
 * Priority comparator helper
 */
function isHigherPriority(prA, prB, lowerIsHigher) {
  return lowerIsHigher ? prA < prB : prA > prB;
}

/**
 * Merge consecutive 1-unit ticks with identical PID into contiguous Gantt segments
 */
function buildGanttFromTicks(ticks) {
  if (!ticks || ticks.length === 0) return [];
  const gantt = [];
  let cur = {
    pid: ticks[0].pid,
    start: ticks[0].time,
    end: ticks[0].time + 1,
    preempted: false
  };

  for (let i = 1; i < ticks.length; i++) {
    const u = ticks[i];
    if (u.pid === cur.pid) {
      cur.end = u.time + 1;
    } else {
      if (cur.pid !== 'IDLE' && ticks[i - 1].preempted) {
        cur.preempted = true;
      }
      gantt.push(cur);
      cur = {
        pid: u.pid,
        start: u.time,
        end: u.time + 1,
        preempted: false
      };
    }
  }
  if (cur.pid !== 'IDLE' && ticks[ticks.length - 1].preempted) {
    cur.preempted = true;
  }
  gantt.push(cur);
  return gantt;
}

/**
 * Count context switches between different real processes (excluding IDLE)
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
 * Finalize metrics and per-process accounting
 */
function finalizeMetrics(procs, rawTicks, firstCpuMap, completionMap) {
  const gantt = buildGanttFromTicks(rawTicks);
  const contextSwitches = countContextSwitches(gantt);
  const perProcess = {};
  let sumTat = 0;
  let sumWt = 0;
  let sumRt = 0;

  procs.forEach(p => {
    const ct = completionMap[p.pid] !== undefined ? completionMap[p.pid] : p.at;
    const tat = ct - p.at;
    const wt = tat - p.bt;
    const firstCpu = firstCpuMap[p.pid] !== undefined ? firstCpuMap[p.pid] : p.at;
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

  const totalTime = rawTicks.length > 0 ? rawTicks[rawTicks.length - 1].time + 1 : 0;
  let totalBusy = 0;
  rawTicks.forEach(u => {
    if (u.pid !== 'IDLE') totalBusy++;
  });
  const cpuUtilization = totalTime > 0 ? Number(((totalBusy / totalTime) * 100).toFixed(2)) : 0;
  const throughput = totalTime > 0 ? Number((n / totalTime).toFixed(4)) : 0;

  return {
    gantt,
    perProcess,
    contextSwitches,
    avgTat,
    avgWt,
    avgRt,
    cpuUtilization,
    throughput,
    totalTime
  };
}

// =========================================================================
// 1. FCFS - Naive Tick-by-Tick Simulator
// Non-preemptive: once dispatched, runs until burst exhausted.
// Selection: earliest arrival time ASC; ties broken by natural PID ASC.
// =========================================================================
function fcfs(rawProcs, options = {}) {
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  let t = 0;
  let runningPid = null;
  let completedCount = 0;

  while (completedCount < n) {
    // If CPU is free, select next job according to FCFS rules
    if (!runningPid) {
      const arrivedAndReady = procs.filter(p => p.at <= t && remaining[p.pid] > 0);
      if (arrivedAndReady.length > 0) {
        arrivedAndReady.sort((a, b) => {
          if (a.at !== b.at) return a.at - b.at;
          return comparePid(a.pid, b.pid);
        });
        runningPid = arrivedAndReady[0].pid;
        if (firstCpu[runningPid] === undefined) {
          firstCpu[runningPid] = t;
        }
      }
    }

    // Execute 1 tick
    if (runningPid) {
      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;
      if (remaining[runningPid] === 0) {
        completion[runningPid] = t + 1;
        completedCount++;
        runningPid = null;
      }
    } else {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
    }

    t++;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

// =========================================================================
// 2. SJF (Non-Preemptive) - Naive Tick-by-Tick Simulator
// Non-preemptive: once dispatched, runs until burst exhausted.
// Selection: smallest initial burst time ASC;
// ties broken by earlier arrival time ASC, then natural PID ASC.
// =========================================================================
function sjf(rawProcs, options = {}) {
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  let t = 0;
  let runningPid = null;
  let completedCount = 0;

  while (completedCount < n) {
    if (!runningPid) {
      const arrivedAndReady = procs.filter(p => p.at <= t && remaining[p.pid] > 0);
      if (arrivedAndReady.length > 0) {
        arrivedAndReady.sort((a, b) => {
          if (a.bt !== b.bt) return a.bt - b.bt;
          if (a.at !== b.at) return a.at - b.at;
          return comparePid(a.pid, b.pid);
        });
        runningPid = arrivedAndReady[0].pid;
        if (firstCpu[runningPid] === undefined) {
          firstCpu[runningPid] = t;
        }
      }
    }

    // Execute 1 tick
    if (runningPid) {
      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;
      if (remaining[runningPid] === 0) {
        completion[runningPid] = t + 1;
        completedCount++;
        runningPid = null;
      }
    } else {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
    }

    t++;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

// =========================================================================
// 3. SRTF (Preemptive SJF) - Naive Tick-by-Tick Simulator
// At each tick t, examine all available processes.
// Candidate sort: remaining time ASC, arrival time ASC, natural PID ASC.
// Preemption rule: preempt running process ONLY if candidate has strictly
// smaller remaining time. Do NOT preempt on equal remaining time.
// =========================================================================
function srtf(rawProcs, options = {}) {
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  let t = 0;
  let runningPid = null;
  let completedCount = 0;

  while (completedCount < n) {
    const arrivedAndReady = procs.filter(p => p.at <= t && remaining[p.pid] > 0);

    if (arrivedAndReady.length === 0) {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
      runningPid = null;
    } else {
      arrivedAndReady.sort((a, b) => {
        const remA = remaining[a.pid];
        const remB = remaining[b.pid];
        if (remA !== remB) return remA - remB;
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const bestCandidate = arrivedAndReady[0].pid;

      if (runningPid && remaining[runningPid] > 0 && bestCandidate !== runningPid) {
        // Preempt only if best candidate has STRICTLY smaller remaining burst
        if (remaining[bestCandidate] < remaining[runningPid]) {
          if (rawTicks.length > 0 && rawTicks[rawTicks.length - 1].pid === runningPid) {
            rawTicks[rawTicks.length - 1].preempted = true;
          }
          runningPid = bestCandidate;
        }
        // Otherwise runningPid retains the CPU
      } else {
        runningPid = bestCandidate;
      }

      if (firstCpu[runningPid] === undefined) {
        firstCpu[runningPid] = t;
      }

      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;

      if (remaining[runningPid] === 0) {
        completion[runningPid] = t + 1;
        completedCount++;
        runningPid = null;
      }
    }

    t++;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

// =========================================================================
// 4. Priority (Non-Preemptive) - Naive Tick-by-Tick Simulator
// Non-preemptive: once dispatched, runs until burst exhausted.
// Selection: highest priority (lowerIsHigher toggle);
// ties broken by earlier arrival time ASC, then natural PID ASC.
// =========================================================================
function priorityNonPreemptive(rawProcs, options = {}) {
  const opts = options || {};
  const lowerIsHigher = opts.lowerIsHigher !== false;
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  let t = 0;
  let runningPid = null;
  let completedCount = 0;

  while (completedCount < n) {
    if (!runningPid) {
      const arrivedAndReady = procs.filter(p => p.at <= t && remaining[p.pid] > 0);
      if (arrivedAndReady.length > 0) {
        arrivedAndReady.sort((a, b) => {
          if (a.pr !== b.pr) return isHigherPriority(a.pr, b.pr, lowerIsHigher) ? -1 : 1;
          if (a.at !== b.at) return a.at - b.at;
          return comparePid(a.pid, b.pid);
        });
        runningPid = arrivedAndReady[0].pid;
        if (firstCpu[runningPid] === undefined) {
          firstCpu[runningPid] = t;
        }
      }
    }

    // Execute 1 tick
    if (runningPid) {
      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;
      if (remaining[runningPid] === 0) {
        completion[runningPid] = t + 1;
        completedCount++;
        runningPid = null;
      }
    } else {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
    }

    t++;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

// =========================================================================
// 5. Priority (Preemptive) - Naive Tick-by-Tick Simulator
// At each tick t, examine all available processes.
// Candidate sort: highest priority (lowerIsHigher toggle), arrival ASC, PID ASC.
// Preemption rule: preempt running process ONLY if candidate has strictly
// higher priority. Do NOT preempt on equal priority.
// =========================================================================
function priorityPreemptive(rawProcs, options = {}) {
  const opts = options || {};
  const lowerIsHigher = opts.lowerIsHigher !== false;
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  let t = 0;
  let runningPid = null;
  let completedCount = 0;

  while (completedCount < n) {
    const arrivedAndReady = procs.filter(p => p.at <= t && remaining[p.pid] > 0);

    if (arrivedAndReady.length === 0) {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
      runningPid = null;
    } else {
      arrivedAndReady.sort((a, b) => {
        if (a.pr !== b.pr) return isHigherPriority(a.pr, b.pr, lowerIsHigher) ? -1 : 1;
        if (a.at !== b.at) return a.at - b.at;
        return comparePid(a.pid, b.pid);
      });

      const bestCandidate = arrivedAndReady[0].pid;

      if (runningPid && remaining[runningPid] > 0 && bestCandidate !== runningPid) {
        const curPr = procs.find(p => p.pid === runningPid).pr;
        const bestPr = procs.find(p => p.pid === bestCandidate).pr;
        if (isHigherPriority(bestPr, curPr, lowerIsHigher)) {
          if (rawTicks.length > 0 && rawTicks[rawTicks.length - 1].pid === runningPid) {
            rawTicks[rawTicks.length - 1].preempted = true;
          }
          runningPid = bestCandidate;
        }
      } else {
        runningPid = bestCandidate;
      }

      if (firstCpu[runningPid] === undefined) {
        firstCpu[runningPid] = t;
      }

      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;

      if (remaining[runningPid] === 0) {
        completion[runningPid] = t + 1;
        completedCount++;
        runningPid = null;
      }
    }

    t++;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

// =========================================================================
// 6. Round Robin - Naive Tick-by-Tick Simulator
// Time quantum q.
// Strict queue ordering:
// - At the start of tick t, if no process running, dequeue head of readyQueue.
// - Process runs for 1 tick [t, t+1).
// - At tick boundary t+1:
//   1. Check all new arrivals at t+1 (sorted by PID) -> added to readyQueue FIRST.
//   2. Check running process:
//      - If completed (remaining == 0): completion marked at t+1.
//      - Else if quantum expired (slice == q): marked preempted, re-enqueued SECOND.
//      - Else: continues executing next tick.
// =========================================================================
function roundRobin(rawProcs, options = {}) {
  const opts = options || {};
  const quantum = opts.quantum ? Math.max(1, Math.floor(Number(opts.quantum))) : 3;
  const procs = normalizeProcesses(rawProcs);
  const n = procs.length;
  if (n === 0) return finalizeMetrics([], [], {}, {});

  const remaining = {};
  procs.forEach(p => (remaining[p.pid] = p.bt));
  const firstCpu = {};
  const completion = {};
  const rawTicks = [];

  const readyQueue = [];
  const arrivedSet = new Set();

  function getArrivalsAt(time) {
    const arrived = procs
      .filter(p => p.at === time && !arrivedSet.has(p.pid))
      .sort((a, b) => comparePid(a.pid, b.pid));
    arrived.forEach(p => arrivedSet.add(p.pid));
    return arrived.map(p => p.pid);
  }

  // Arrivals at t=0
  getArrivalsAt(0).forEach(pid => readyQueue.push(pid));

  let t = 0;
  let runningPid = null;
  let currentSlice = 0;
  let completedCount = 0;

  while (completedCount < n) {
    // Dispatch from ready queue if CPU is free
    if (!runningPid) {
      if (readyQueue.length > 0) {
        runningPid = readyQueue.shift();
        currentSlice = 0;
        if (firstCpu[runningPid] === undefined) {
          firstCpu[runningPid] = t;
        }
      }
    }

    // Execute 1 tick
    if (runningPid) {
      rawTicks.push({ pid: runningPid, time: t, preempted: false });
      remaining[runningPid]--;
      currentSlice++;
    } else {
      rawTicks.push({ pid: 'IDLE', time: t, preempted: false });
    }

    const nextT = t + 1;
    // Step 1: Enqueue new arrivals arriving at the boundary nextT FIRST
    const newArrivals = getArrivalsAt(nextT);
    newArrivals.forEach(pid => readyQueue.push(pid));

    // Step 2: Check running process completion or preemption
    if (runningPid) {
      if (remaining[runningPid] === 0) {
        completion[runningPid] = nextT;
        completedCount++;
        runningPid = null;
        currentSlice = 0;
      } else if (currentSlice === quantum) {
        rawTicks[rawTicks.length - 1].preempted = true;
        // Preempted process is re-enqueued SECOND (behind new arrivals)
        readyQueue.push(runningPid);
        runningPid = null;
        currentSlice = 0;
      }
    }

    t = nextT;
  }

  return finalizeMetrics(procs, rawTicks, firstCpu, completion);
}

module.exports = {
  comparePid,
  normalizeProcesses,
  fcfs,
  sjf,
  srtf,
  priorityNonPreemptive,
  priorityPreemptive,
  roundRobin
};

if (require.main === module) {
  console.log('Running self-test for tests/reference.js...');
  const classic = [
    { pid: 'P1', at: 0, bt: 8, pr: 2 },
    { pid: 'P2', at: 1, bt: 4, pr: 1 },
    { pid: 'P3', at: 2, bt: 9, pr: 4 },
    { pid: 'P4', at: 3, bt: 5, pr: 3 }
  ];
  const opt = { quantum: 3, lowerIsHigher: true };
  const rFcfs = fcfs(classic, opt);
  const rSjf = sjf(classic, opt);
  const rSrtf = srtf(classic, opt);
  const rPrNp = priorityNonPreemptive(classic, opt);
  const rPrP = priorityPreemptive(classic, opt);
  const rRr = roundRobin(classic, opt);

  const assert = require('assert');
  assert.strictEqual(rFcfs.avgTat, 15.25);
  assert.strictEqual(rSjf.avgTat, 14.25);
  assert.strictEqual(rSrtf.avgTat, 13.00);
  assert.strictEqual(rPrNp.avgTat, 14.25);
  assert.strictEqual(rPrP.avgTat, 13.50);
  assert.strictEqual(rRr.avgTat, 20.00);
  console.log('reference.js self-test passed on classic set successfully!');
}
