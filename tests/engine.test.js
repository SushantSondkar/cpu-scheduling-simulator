/**
 * tests/engine.test.js
 * Comprehensive Verification Test Suite for CPU Scheduling Engine (engine.js)
 * Operating Systems Coursework - Problem Statement 55
 *
 * Uses plain Node assert, zero external libraries.
 * Run with: node tests/engine.test.js
 */

const assert = require('assert');
const path = require('path');
const Sched = require(path.join(__dirname, '..', 'engine.js'));
const Ref = require(path.join(__dirname, 'reference.js'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } catch (err) {
    failedTests++;
    failureDetails.push({ description, err });
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
  }
}

const suiteStartTime = Date.now();

console.log('\n================================================================');
console.log('       CPU SCHEDULING ENGINE COMPREHENSIVE TEST SUITE');
console.log('       Operating Systems Coursework - Problem Statement 55');
console.log('================================================================\n');

// =========================================================================
// 1. THE CLASSIC TEST SET (Problem Statement 55 Specification)
// =========================================================================
console.log('--- 1. Classic Test Set (Problem Statement 55 Spec) ---');

const classicProcesses = [
  { pid: 'P1', at: 0, bt: 8, pr: 2 },
  { pid: 'P2', at: 1, bt: 4, pr: 1 },
  { pid: 'P3', at: 2, bt: 9, pr: 4 },
  { pid: 'P4', at: 3, bt: 5, pr: 3 }
];
const classicOptions = { quantum: 3, lowerIsHigher: true };

test('Classic Set - FCFS: Avg TAT = 15.25, Context Switches = 3, Gantt & Metrics', () => {
  const res = Sched.fcfs(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 15.25, `Expected avgTat 15.25, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 8.75, `Expected avgWt 8.75, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 3, `Expected contextSwitches 3, got ${res.contextSwitches}`);
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 8 },
      { pid: 'P2', start: 8, end: 12 },
      { pid: 'P3', start: 12, end: 21 },
      { pid: 'P4', start: 21, end: 26 }
    ]
  );
  assert.strictEqual(res.perProcess['P1'].ct, 8);
  assert.strictEqual(res.perProcess['P2'].ct, 12);
  assert.strictEqual(res.perProcess['P3'].ct, 21);
  assert.strictEqual(res.perProcess['P4'].ct, 26);

  assert.strictEqual(res.perProcess['P1'].tat, 8);
  assert.strictEqual(res.perProcess['P2'].tat, 11);
  assert.strictEqual(res.perProcess['P3'].tat, 19);
  assert.strictEqual(res.perProcess['P4'].tat, 23);

  assert.strictEqual(res.perProcess['P1'].wt, 0);
  assert.strictEqual(res.perProcess['P2'].wt, 7);
  assert.strictEqual(res.perProcess['P3'].wt, 10);
  assert.strictEqual(res.perProcess['P4'].wt, 18);
});

test('Classic Set - SJF Non-Preemptive: Avg TAT = 14.25, Context Switches = 3, Gantt & Metrics', () => {
  const res = Sched.sjf(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 14.25, `Expected avgTat 14.25, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 7.75, `Expected avgWt 7.75, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 3, `Expected contextSwitches 3, got ${res.contextSwitches}`);
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 8 },
      { pid: 'P2', start: 8, end: 12 },
      { pid: 'P4', start: 12, end: 17 },
      { pid: 'P3', start: 17, end: 26 }
    ]
  );
  assert.strictEqual(res.perProcess['P1'].ct, 8);
  assert.strictEqual(res.perProcess['P2'].ct, 12);
  assert.strictEqual(res.perProcess['P4'].ct, 17);
  assert.strictEqual(res.perProcess['P3'].ct, 26);
});

test('Classic Set - SRTF Preemptive: Avg TAT = 13.00, Context Switches = 4, Full Gantt & Preemption Flags', () => {
  const res = Sched.srtf(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 13.00, `Expected avgTat 13.00, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 6.50, `Expected avgWt 6.50, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 4, `Expected contextSwitches 4, got ${res.contextSwitches}`);

  // Full Gantt specification including preemption flags
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end, preempted: g.preempted })),
    [
      { pid: 'P1', start: 0, end: 1, preempted: true },
      { pid: 'P2', start: 1, end: 5, preempted: false },
      { pid: 'P4', start: 5, end: 10, preempted: false },
      { pid: 'P1', start: 10, end: 17, preempted: false },
      { pid: 'P3', start: 17, end: 26, preempted: false }
    ]
  );

  // Exact per-process completion, turnaround, wait, response times
  assert.deepStrictEqual(res.perProcess['P1'], {
    pid: 'P1', at: 0, bt: 8, pr: 2, ct: 17, tat: 17, wt: 9, rt: 0, firstCpuTime: 0
  });
  assert.deepStrictEqual(res.perProcess['P2'], {
    pid: 'P2', at: 1, bt: 4, pr: 1, ct: 5, tat: 4, wt: 0, rt: 0, firstCpuTime: 1
  });
  assert.deepStrictEqual(res.perProcess['P3'], {
    pid: 'P3', at: 2, bt: 9, pr: 4, ct: 26, tat: 24, wt: 15, rt: 15, firstCpuTime: 17
  });
  assert.deepStrictEqual(res.perProcess['P4'], {
    pid: 'P4', at: 3, bt: 5, pr: 3, ct: 10, tat: 7, wt: 2, rt: 2, firstCpuTime: 5
  });
});

test('Classic Set - Priority Non-Preemptive: Avg TAT = 14.25, Context Switches = 3, Gantt', () => {
  const res = Sched.priorityNonPreemptive(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 14.25, `Expected avgTat 14.25, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 7.75, `Expected avgWt 7.75, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 3, `Expected contextSwitches 3, got ${res.contextSwitches}`);
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 8 },
      { pid: 'P2', start: 8, end: 12 },
      { pid: 'P4', start: 12, end: 17 },
      { pid: 'P3', start: 17, end: 26 }
    ]
  );
});

test('Classic Set - Priority Preemptive: Avg TAT = 13.50, Context Switches = 4, Gantt & Metrics', () => {
  const res = Sched.priorityPreemptive(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 13.50, `Expected avgTat 13.50, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 7.00, `Expected avgWt 7.00, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 4, `Expected contextSwitches 4, got ${res.contextSwitches}`);
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 5 },
      { pid: 'P1', start: 5, end: 12 },
      { pid: 'P4', start: 12, end: 17 },
      { pid: 'P3', start: 17, end: 26 }
    ]
  );
  assert.strictEqual(res.perProcess['P2'].ct, 5);
  assert.strictEqual(res.perProcess['P1'].ct, 12);
  assert.strictEqual(res.perProcess['P4'].ct, 17);
  assert.strictEqual(res.perProcess['P3'].ct, 26);
});

test('Classic Set - Round Robin (q=3): Avg TAT = 20.00, Context Switches = 9, Full Gantt & Preemption Flags', () => {
  const res = Sched.roundRobin(classicProcesses, classicOptions);
  assert.strictEqual(res.avgTat, 20.00, `Expected avgTat 20.00, got ${res.avgTat}`);
  assert.strictEqual(res.avgWt, 13.50, `Expected avgWt 13.50, got ${res.avgWt}`);
  assert.strictEqual(res.contextSwitches, 9, `Expected contextSwitches 9, got ${res.contextSwitches}`);

  // Full Gantt specification for RR(q=3)
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end, preempted: g.preempted })),
    [
      { pid: 'P1', start: 0, end: 3, preempted: true },
      { pid: 'P2', start: 3, end: 6, preempted: true },
      { pid: 'P3', start: 6, end: 9, preempted: true },
      { pid: 'P4', start: 9, end: 12, preempted: true },
      { pid: 'P1', start: 12, end: 15, preempted: true },
      { pid: 'P2', start: 15, end: 16, preempted: false },
      { pid: 'P3', start: 16, end: 19, preempted: true },
      { pid: 'P4', start: 19, end: 21, preempted: false },
      { pid: 'P1', start: 21, end: 23, preempted: false },
      { pid: 'P3', start: 23, end: 26, preempted: false }
    ]
  );

  assert.deepStrictEqual(res.perProcess['P1'], {
    pid: 'P1', at: 0, bt: 8, pr: 2, ct: 23, tat: 23, wt: 15, rt: 0, firstCpuTime: 0
  });
  assert.deepStrictEqual(res.perProcess['P2'], {
    pid: 'P2', at: 1, bt: 4, pr: 1, ct: 16, tat: 15, wt: 11, rt: 2, firstCpuTime: 3
  });
  assert.deepStrictEqual(res.perProcess['P3'], {
    pid: 'P3', at: 2, bt: 9, pr: 4, ct: 26, tat: 24, wt: 15, rt: 4, firstCpuTime: 6
  });
  assert.deepStrictEqual(res.perProcess['P4'], {
    pid: 'P4', at: 3, bt: 5, pr: 3, ct: 21, tat: 18, wt: 13, rt: 6, firstCpuTime: 9
  });
});

test('Classic Set - runAll Comparison: SRTF Rank 1, Proper Rankings & Tie-Handling', () => {
  const all = Sched.runAll(classicProcesses, classicOptions);
  assert.strictEqual(all.bestAvgTat, 13.00);
  assert.deepStrictEqual(all.bestAlgorithms, ['SRTF']);

  // Check ranking order and ranks
  const comp = all.comparison;
  assert.strictEqual(comp.length, 6);
  assert.strictEqual(comp[0].id, 'srtf');
  assert.strictEqual(comp[0].rank, 1);
  assert.strictEqual(comp[0].isBest, true);

  assert.strictEqual(comp[1].id, 'priorityP');
  assert.strictEqual(comp[1].rank, 2);

  // SJF and Priority NP tie at avgTat 14.25 -> same rank 3
  assert.strictEqual(comp[2].avgTat, 14.25);
  assert.strictEqual(comp[2].rank, 3);
  assert.strictEqual(comp[3].avgTat, 14.25);
  assert.strictEqual(comp[3].rank, 3);

  // FCFS is rank 5
  assert.strictEqual(comp[4].id, 'fcfs');
  assert.strictEqual(comp[4].rank, 5);

  // RR is rank 6
  assert.strictEqual(comp[5].id, 'rr');
  assert.strictEqual(comp[5].rank, 6);
});

// =========================================================================
// 2. EDGE CASES
// =========================================================================
console.log('\n--- 2. Comprehensive Edge Cases ---');

test('Edge Case: Single process arriving at time 0', () => {
  const sp = [{ pid: 'P1', at: 0, bt: 5, pr: 1 }];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const res = Sched[alg](sp, { quantum: 2 });
    assert.strictEqual(res.avgTat, 5, `${alg}: avgTat`);
    assert.strictEqual(res.avgWt, 0, `${alg}: avgWt`);
    assert.strictEqual(res.avgRt, 0, `${alg}: avgRt`);
    assert.strictEqual(res.contextSwitches, 0, `${alg}: contextSwitches`);
    assert.strictEqual(res.perProcess['P1'].ct, 5, `${alg}: ct`);
    assert.strictEqual(res.perProcess['P1'].tat, 5, `${alg}: tat`);
    assert.strictEqual(res.perProcess['P1'].wt, 0, `${alg}: wt`);
    assert.deepStrictEqual(
      res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      [{ pid: 'P1', start: 0, end: 5 }],
      `${alg}: gantt`
    );
  }
});

test('Edge Case: Single process with Round Robin requiring multiple quantum slices', () => {
  // BT=7, quantum=2 -> 4 slices executed, but since it is the only process,
  // Gantt chart must merge them into a single contiguous block with 0 context switches.
  const sp = [{ pid: 'P1', at: 0, bt: 7 }];
  const res = Sched.roundRobin(sp, { quantum: 2 });
  assert.strictEqual(res.gantt.length, 1);
  assert.strictEqual(res.gantt[0].pid, 'P1');
  assert.strictEqual(res.gantt[0].start, 0);
  assert.strictEqual(res.gantt[0].end, 7);
  assert.strictEqual(res.contextSwitches, 0);
  assert.strictEqual(res.perProcess['P1'].ct, 7);
  assert.strictEqual(res.perProcess['P1'].tat, 7);
  assert.strictEqual(res.perProcess['P1'].wt, 0);
});

test('Edge Case: All processes arrive at time 0 (Convoy effect & SJF/SRTF equivalence)', () => {
  const allZero = [
    { pid: 'P1', at: 0, bt: 4, pr: 3 },
    { pid: 'P2', at: 0, bt: 2, pr: 1 },
    { pid: 'P3', at: 0, bt: 1, pr: 2 }
  ];

  // FCFS: P1(0-4), P2(4-6), P3(6-7) -> CT: 4, 6, 7. TAT: 4, 6, 7. Avg TAT = 17/3 = 5.67
  const rFcfs = Sched.fcfs(allZero);
  assert.strictEqual(rFcfs.avgTat, 5.67);
  assert.deepStrictEqual(rFcfs.gantt.map(g => g.pid), ['P1', 'P2', 'P3']);

  // When all arrive at 0, non-preemptive SJF and preemptive SRTF MUST be identical
  const rSjf = Sched.sjf(allZero);
  const rSrtf = Sched.srtf(allZero);
  assert.strictEqual(rSjf.avgTat, 3.67);
  assert.strictEqual(rSrtf.avgTat, 3.67);
  assert.deepStrictEqual(rSjf.gantt, rSrtf.gantt);
  assert.deepStrictEqual(rSjf.gantt.map(g => g.pid), ['P3', 'P2', 'P1']);

  // Priority NP and Priority P must also be identical when all arrive at 0
  const rPrNp = Sched.priorityNonPreemptive(allZero, { lowerIsHigher: true });
  const rPrP = Sched.priorityPreemptive(allZero, { lowerIsHigher: true });
  assert.deepStrictEqual(rPrNp.gantt, rPrP.gantt);
  assert.deepStrictEqual(rPrNp.gantt.map(g => g.pid), ['P2', 'P3', 'P1']);

  // Round Robin with q=2: P1(0-2), P2(2-4), P3(4-5), P1(5-7)
  const rRr = Sched.roundRobin(allZero, { quantum: 2 });
  assert.deepStrictEqual(
    rRr.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P3', start: 4, end: 5 },
      { pid: 'P1', start: 5, end: 7 }
    ]
  );
  assert.strictEqual(rRr.perProcess['P2'].ct, 4);
  assert.strictEqual(rRr.perProcess['P3'].ct, 5);
  assert.strictEqual(rRr.perProcess['P1'].ct, 7);
});

test('Edge Case: CPU idle at the very start (one process AT=2, BT=3 -> CT=5, TAT=3, WT=0)', () => {
  const idleStart = [{ pid: 'P1', at: 2, bt: 3, pr: 1 }];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const res = Sched[alg](idleStart, { quantum: 2 });
    assert.strictEqual(res.perProcess['P1'].ct, 5, `${alg}: CT`);
    assert.strictEqual(res.perProcess['P1'].tat, 3, `${alg}: TAT`);
    assert.strictEqual(res.perProcess['P1'].wt, 0, `${alg}: WT`);
    assert.strictEqual(res.perProcess['P1'].rt, 0, `${alg}: RT`);
    assert.strictEqual(res.contextSwitches, 0, `${alg}: CS`);
    assert.deepStrictEqual(
      res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      [
        { pid: 'IDLE', start: 0, end: 2 },
        { pid: 'P1', start: 2, end: 5 }
      ],
      `${alg}: Gantt`
    );
  }
});

test('Edge Case: Multiple processes with CPU idle at very start', () => {
  const procs = [
    { pid: 'P1', at: 3, bt: 2, pr: 2 },
    { pid: 'P2', at: 7, bt: 3, pr: 1 }
  ];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const res = Sched[alg](procs, { quantum: 2 });
    assert.deepStrictEqual(
      res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      [
        { pid: 'IDLE', start: 0, end: 3 },
        { pid: 'P1', start: 3, end: 5 },
        { pid: 'IDLE', start: 5, end: 7 },
        { pid: 'P2', start: 7, end: 10 }
      ],
      `${alg}: Gantt`
    );
    // Real processes are P1 then P2 -> 1 context switch across real processes
    assert.strictEqual(res.contextSwitches, 1, `${alg}: CS`);
  }
});

test('Edge Case: Idle gap in the middle (Context switch neutrality across idle gap)', () => {
  const idleMid = [
    { pid: 'P1', at: 0, bt: 2, pr: 1 },
    { pid: 'P2', at: 6, bt: 3, pr: 1 }
  ];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const res = Sched[alg](idleMid, { quantum: 2 });
    assert.deepStrictEqual(
      res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      [
        { pid: 'P1', start: 0, end: 2 },
        { pid: 'IDLE', start: 2, end: 6 },
        { pid: 'P2', start: 6, end: 9 }
      ],
      `${alg}: Gantt`
    );
    assert.strictEqual(res.contextSwitches, 1, `${alg}: Context switches across idle gap`);
    assert.strictEqual(res.perProcess['P1'].ct, 2);
    assert.strictEqual(res.perProcess['P1'].tat, 2);
    assert.strictEqual(res.perProcess['P1'].wt, 0);
    assert.strictEqual(res.perProcess['P2'].ct, 9);
    assert.strictEqual(res.perProcess['P2'].tat, 3);
    assert.strictEqual(res.perProcess['P2'].wt, 0);
  }
});

test('Edge Case: Identical burst times (Tie-breaking by arrival time and PID)', () => {
  const sameBt = [
    { pid: 'P1', at: 0, bt: 4, pr: 2 },
    { pid: 'P2', at: 0, bt: 4, pr: 1 },
    { pid: 'P3', at: 1, bt: 4, pr: 3 }
  ];

  // SJF: At t=0, P1 and P2 tied on burst (4) and arrival (0). Natural PID tie-break chooses P1.
  // P1 runs 0-4. At t=4, P2 (at=0) vs P3 (at=1) -> P2 arrived earlier, runs 4-8. P3 runs 8-12.
  const rSjf = Sched.sjf(sameBt);
  assert.deepStrictEqual(rSjf.gantt.map(g => g.pid), ['P1', 'P2', 'P3']);
  assert.strictEqual(rSjf.perProcess['P1'].ct, 4);
  assert.strictEqual(rSjf.perProcess['P2'].ct, 8);
  assert.strictEqual(rSjf.perProcess['P3'].ct, 12);

  // SRTF: At t=0, P1 chosen by PID tie-break. At t=1, P1 remaining is 3, P2 is 4, P3 is 4.
  // P1 retains CPU! Runs to completion at 4. Then P2, then P3.
  const rSrtf = Sched.srtf(sameBt);
  assert.deepStrictEqual(rSrtf.gantt.map(g => g.pid), ['P1', 'P2', 'P3']);
});

test('Edge Case: Identical priorities (Tie-breaking and non-preemption on equal priority)', () => {
  const samePr = [
    { pid: 'P1', at: 0, bt: 3, pr: 2 },
    { pid: 'P2', at: 0, bt: 2, pr: 2 },
    { pid: 'P3', at: 1, bt: 1, pr: 2 }
  ];

  // Priority NP: At 0, P1 and P2 have same priority. Tied on arrival (0). PID chooses P1.
  // P1 runs 0-3. At 3, P2 (at=0) vs P3 (at=1) -> earlier arrival runs P2(3-5), then P3(5-6).
  const rPrNp = Sched.priorityNonPreemptive(samePr);
  assert.deepStrictEqual(rPrNp.gantt.map(g => g.pid), ['P1', 'P2', 'P3']);

  // Priority Preemptive: At 0, P1 dispatched. At t=1, P3 arrives with equal priority (2).
  // Rule: Do NOT preempt on equal priority! P1 continues to 3. Then P2 runs 3-5, P3 runs 5-6.
  const rPrP = Sched.priorityPreemptive(samePr);
  assert.deepStrictEqual(rPrP.gantt.map(g => g.pid), ['P1', 'P2', 'P3']);
  assert.strictEqual(rPrP.contextSwitches, 2);
  assert.strictEqual(rPrP.perProcess['P1'].ct, 3);
  assert.strictEqual(rPrP.perProcess['P2'].ct, 5);
  assert.strictEqual(rPrP.perProcess['P3'].ct, 6);
});

test('Edge Case: Priority toggle lowerIsHigher=false with preemption', () => {
  const pList = [
    { pid: 'P1', at: 0, bt: 6, pr: 5 },
    { pid: 'P2', at: 2, bt: 2, pr: 10 }
  ];
  // With lowerIsHigher=false, larger number = higher priority.
  // At t=2, P2 arrives with pr=10 > 5 -> preemption!
  const res = Sched.priorityPreemptive(pList, { lowerIsHigher: false });
  assert.deepStrictEqual(
    res.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 8 }
    ]
  );
  assert.strictEqual(res.contextSwitches, 2);
});

test('Edge Case: Quantum = 1 in Round Robin', () => {
  const q1Procs = [
    { pid: 'P1', at: 0, bt: 2 },
    { pid: 'P2', at: 0, bt: 2 }
  ];
  const rQ1 = Sched.roundRobin(q1Procs, { quantum: 1 });
  assert.deepStrictEqual(
    rQ1.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    [
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 2 },
      { pid: 'P1', start: 2, end: 3 },
      { pid: 'P2', start: 3, end: 4 }
    ]
  );
  assert.strictEqual(rQ1.contextSwitches, 3);
  assert.strictEqual(rQ1.perProcess['P1'].ct, 3);
  assert.strictEqual(rQ1.perProcess['P2'].ct, 4);
});

test('Edge Case: Quantum larger than every burst (RR must match FCFS exactly)', () => {
  const qBigProcs = [
    { pid: 'P1', at: 0, bt: 5 },
    { pid: 'P2', at: 2, bt: 3 },
    { pid: 'P3', at: 4, bt: 2 }
  ];
  const rQBig = Sched.roundRobin(qBigProcs, { quantum: 100 });
  const rFcfs = Sched.fcfs(qBigProcs);

  assert.deepStrictEqual(
    rQBig.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
    rFcfs.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end }))
  );
  assert.strictEqual(rQBig.avgTat, rFcfs.avgTat);
  assert.strictEqual(rQBig.avgWt, rFcfs.avgWt);
  assert.strictEqual(rQBig.avgRt, rFcfs.avgRt);
  assert.strictEqual(rQBig.contextSwitches, rFcfs.contextSwitches);
  assert.strictEqual(rQBig.cpuUtilization, rFcfs.cpuUtilization);
  assert.strictEqual(rQBig.throughput, rFcfs.throughput);

  for (const pid of ['P1', 'P2', 'P3']) {
    assert.strictEqual(rQBig.perProcess[pid].ct, rFcfs.perProcess[pid].ct);
    assert.strictEqual(rQBig.perProcess[pid].tat, rFcfs.perProcess[pid].tat);
    assert.strictEqual(rQBig.perProcess[pid].wt, rFcfs.perProcess[pid].wt);
    assert.strictEqual(rQBig.perProcess[pid].rt, rFcfs.perProcess[pid].rt);
  }
});

test('Edge Case: Two processes with equal arrival and equal burst (PID tie-break)', () => {
  // P2 passed before P1 in array, but both arrive at t=1 with burst 4.
  // Natural PID comparator ('P1' < 'P2') must break ties in favor of P1 across ALL algorithms.
  const tieProcs = [
    { pid: 'P2', at: 1, bt: 4, pr: 2 },
    { pid: 'P1', at: 1, bt: 4, pr: 2 }
  ];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const res = Sched[alg](tieProcs, { quantum: 2 });
    assert.strictEqual(res.gantt[0].pid, 'IDLE', `${alg}: IDLE at 0`);
    assert.strictEqual(res.gantt[1].pid, 'P1', `${alg}: P1 must be chosen before P2 by PID tie-break`);
  }
});

test('Edge Case: Natural alphanumeric PID ordering (P2 vs P10 tie-break)', () => {
  // Natural sorting ensures P2 < P10 (instead of lexicographical 'P10' < 'P2')
  const numPidProcs = [
    { pid: 'P10', at: 0, bt: 3 },
    { pid: 'P2', at: 0, bt: 3 }
  ];
  const res = Sched.fcfs(numPidProcs);
  assert.strictEqual(res.gantt[0].pid, 'P2', 'Natural PID order: P2 must run before P10');
  assert.strictEqual(res.gantt[1].pid, 'P10');
});

test('Edge Case: Unsorted input order (Engine produces identical results regardless of order)', () => {
  const unsorted = [
    { pid: 'P3', at: 5, bt: 2, pr: 1 },
    { pid: 'P1', at: 1, bt: 4, pr: 3 },
    { pid: 'P2', at: 0, bt: 3, pr: 2 }
  ];
  const sorted = [
    { pid: 'P2', at: 0, bt: 3, pr: 2 },
    { pid: 'P1', at: 1, bt: 4, pr: 3 },
    { pid: 'P3', at: 5, bt: 2, pr: 1 }
  ];

  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    const rU = Sched[alg](unsorted, { quantum: 2 });
    const rS = Sched[alg](sorted, { quantum: 2 });
    assert.deepStrictEqual(
      rU.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      rS.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      `${alg}: gantt match for unsorted vs sorted`
    );
    assert.strictEqual(rU.avgTat, rS.avgTat, `${alg}: avgTat match`);
    assert.strictEqual(rU.avgWt, rS.avgWt, `${alg}: avgWt match`);
    assert.strictEqual(rU.contextSwitches, rS.contextSwitches, `${alg}: contextSwitches match`);
  }
});

test('Edge Case: Engine does not mutate input process array or objects', () => {
  const original = [
    { pid: 'P1', at: 2, bt: 5, pr: 3 },
    { pid: 'P2', at: 0, bt: 4, pr: 1 }
  ];
  const snapshot = JSON.parse(JSON.stringify(original));
  Sched.runAll(original, { quantum: 2 });
  assert.deepStrictEqual(original, snapshot, 'Input processes array must not be mutated');
});

test('Edge Case: Robustness with null or empty options object', () => {
  const procs = [{ pid: 'P1', at: 0, bt: 3 }];
  for (const alg of ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin']) {
    assert.doesNotThrow(() => Sched[alg](procs, null), `${alg}(procs, null) should not throw`);
  }
  assert.doesNotThrow(() => Sched.runAll(procs, null), 'runAll(procs, null) should not throw');
});

test('Edge Case: Input validation and normalization edge cases', () => {
  // Empty processes
  assert.strictEqual(Sched.validateInput([]).valid, false);
  assert.strictEqual(Sched.validateInput(null).valid, false);

  // Duplicate PID
  const dup = Sched.validateInput([{ pid: 'P1', at: 0, bt: 2 }, { pid: 'P1', at: 1, bt: 3 }]);
  assert.strictEqual(dup.valid, false);
  assert.ok(dup.errors.some(e => e.includes('Duplicate PID')));

  // Reserved PID 'IDLE'
  const idlePid = Sched.validateInput([{ pid: 'IDLE', at: 0, bt: 2 }]);
  assert.strictEqual(idlePid.valid, false);
  assert.ok(idlePid.errors.some(e => e.includes('reserved for CPU idle time')));

  // Numeric PID 0 is valid and not empty
  const numZero = Sched.validateInput([{ pid: 0, at: 0, bt: 2 }]);
  assert.strictEqual(numZero.valid, true);

  // Null at / bt
  assert.strictEqual(Sched.validateInput([{ pid: 'P1', at: null, bt: 2 }]).valid, false);
  assert.strictEqual(Sched.validateInput([{ pid: 'P1', at: 0, bt: null }]).valid, false);

  // Empty string priority normalizes to default priority 1
  const normPr = Sched.priorityNonPreemptive([{ pid: 'P1', at: 0, bt: 2, pr: '' }]);
  assert.strictEqual(normPr.perProcess['P1'].pr, 1);
});

// =========================================================================
// 3. INVARIANTS FOR ALL ALGORITHMS ON 500 RANDOM PROCESS SETS
// =========================================================================
console.log('\n--- 3. Invariants for ALL Algorithms on 500 Random Process Sets ---');

// Reproducible Linear Congruential Generator (LCG)
function createPrng(seed = 123456789) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('500 Random Sets: Validate all scheduling invariants across all algorithms', () => {
  const rng = createPrng(987654321);
  const algorithms = ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin'];
  const NUM_SETS = 500;

  for (let trial = 0; trial < NUM_SETS; trial++) {
    const n = 1 + Math.floor(rng() * 8);
    const procs = [];
    for (let i = 0; i < n; i++) {
      procs.push({
        pid: 'P' + (i + 1),
        at: Math.floor(rng() * 15),
        bt: 1 + Math.floor(rng() * 12),
        pr: 1 + Math.floor(rng() * 8)
      });
    }

    // Deliberately randomize/shuffle array input order
    for (let i = procs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [procs[i], procs[j]] = [procs[j], procs[i]];
    }

    const quantum = 1 + Math.floor(rng() * 6);
    const lowerIsHigher = rng() < 0.5;
    const options = { quantum, lowerIsHigher };

    const results = {};
    for (const a of algorithms) {
      results[a] = Sched[a](procs, options);
    }

    const sumBursts = procs.reduce((acc, p) => acc + p.bt, 0);

    // Invariants 1-6 for EACH algorithm
    for (const a of algorithms) {
      const res = results[a];
      const gantt = res.gantt;

      // Invariant 1: Total busy time equals sum of bursts
      const busyFromGantt = gantt
        .filter(g => g.pid !== 'IDLE')
        .reduce((acc, g) => acc + (g.end - g.start), 0);
      assert.strictEqual(
        busyFromGantt,
        sumBursts,
        `Trial ${trial} (${a}): Total busy time (${busyFromGantt}) != sum of bursts (${sumBursts})`
      );

      // Invariant 2: No Gantt overlaps or negative durations, contiguous from t=0
      if (gantt.length > 0) {
        assert.strictEqual(
          gantt[0].start,
          0,
          `Trial ${trial} (${a}): Gantt chart must start at t=0`
        );
        for (let i = 0; i < gantt.length; i++) {
          assert.ok(
            gantt[i].end > gantt[i].start,
            `Trial ${trial} (${a}): Segment ${i} has non-positive duration [${gantt[i].start}, ${gantt[i].end}]`
          );
          if (i < gantt.length - 1) {
            assert.strictEqual(
              gantt[i].end,
              gantt[i + 1].start,
              `Trial ${trial} (${a}): Gap or overlap between segment ${i} (end=${gantt[i].end}) and segment ${i + 1} (start=${gantt[i + 1].start})`
            );
          }
        }
      }

      // Compute total execution duration per PID from Gantt segments
      const segmentSumByPid = {};
      for (const g of gantt) {
        if (g.pid !== 'IDLE') {
          segmentSumByPid[g.pid] = (segmentSumByPid[g.pid] || 0) + (g.end - g.start);
        }
      }

      // Invariants 3, 4, 5, 6 for every process
      for (const p of procs) {
        const pp = res.perProcess[p.pid];
        assert.ok(pp, `Trial ${trial} (${a}): Missing perProcess entry for ${p.pid}`);

        // Invariant 3: CT >= AT + BT
        assert.ok(
          pp.ct >= p.at + p.bt,
          `Trial ${trial} (${a}): CT (${pp.ct}) < AT + BT (${p.at + p.bt}) for ${p.pid}`
        );

        // Invariant 4: TAT >= BT
        assert.ok(
          pp.tat >= p.bt,
          `Trial ${trial} (${a}): TAT (${pp.tat}) < BT (${p.bt}) for ${p.pid}`
        );

        // Invariant 5: WT >= 0
        assert.ok(
          pp.wt >= 0,
          `Trial ${trial} (${a}): WT (${pp.wt}) < 0 for ${p.pid}`
        );

        // Invariant 6: Sum of segment lengths per PID equals its burst
        assert.strictEqual(
          segmentSumByPid[p.pid] || 0,
          p.bt,
          `Trial ${trial} (${a}): Sum of segments (${segmentSumByPid[p.pid] || 0}) != BT (${p.bt}) for ${p.pid}`
        );
      }
    }

    // Invariant 7: SRTF avg TAT <= SJF avg TAT (with floating point tolerance)
    assert.ok(
      results.srtf.avgTat <= results.sjf.avgTat + 1e-9,
      `Trial ${trial}: SRTF avg TAT (${results.srtf.avgTat}) > SJF avg TAT (${results.sjf.avgTat}) on procs: ${JSON.stringify(procs)}`
    );

    // Invariant 8: SRTF avg WT is minimal among all algorithms (with tolerance)
    for (const a of algorithms) {
      assert.ok(
        results.srtf.avgWt <= results[a].avgWt + 1e-9,
        `Trial ${trial}: SRTF avg WT (${results.srtf.avgWt}) > ${a} avg WT (${results[a].avgWt}) on procs: ${JSON.stringify(procs)}`
      );
    }

    // Invariant 9: RR with huge quantum equals FCFS exactly
    const rrHuge = Sched.roundRobin(procs, { quantum: 999999 });
    const fcfsRes = results.fcfs;

    assert.deepStrictEqual(
      rrHuge.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      fcfsRes.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end })),
      `Trial ${trial}: RR with huge quantum gantt does not match FCFS on procs: ${JSON.stringify(procs)}`
    );
    assert.strictEqual(
      rrHuge.avgTat,
      fcfsRes.avgTat,
      `Trial ${trial}: RR(huge) avgTat (${rrHuge.avgTat}) != FCFS avgTat (${fcfsRes.avgTat})`
    );
    assert.strictEqual(
      rrHuge.avgWt,
      fcfsRes.avgWt,
      `Trial ${trial}: RR(huge) avgWt (${rrHuge.avgWt}) != FCFS avgWt (${fcfsRes.avgWt})`
    );
    assert.strictEqual(
      rrHuge.contextSwitches,
      fcfsRes.contextSwitches,
      `Trial ${trial}: RR(huge) contextSwitches (${rrHuge.contextSwitches}) != FCFS contextSwitches (${fcfsRes.contextSwitches})`
    );
  }
});

// =========================================================================
// 4. 2000 RANDOM PROCESS SETS DIFFERENTIAL TESTING (engine.js vs reference.js)
// =========================================================================
console.log('\n--- 4. 2000 Random Sets Differential Testing vs Naive Reference ---');

test('2000 Random Sets: Validate engine.js against naive tick-by-tick reference.js (12,000 simulations)', () => {
  const diffRng = createPrng(135792468);
  const diffAlgorithms = ['fcfs', 'sjf', 'srtf', 'priorityNonPreemptive', 'priorityPreemptive', 'roundRobin'];
  const NUM_SETS = 2000;

  for (let trial = 0; trial < NUM_SETS; trial++) {
    const n = 1 + Math.floor(diffRng() * 8);
    const procs = [];
    const sharedAt = Math.floor(diffRng() * 12);
    const sharedBt = 1 + Math.floor(diffRng() * 8);
    const sharedPr = 1 + Math.floor(diffRng() * 6);

    for (let i = 0; i < n; i++) {
      // 35% probability of tying arrival, burst, or priority to thoroughly stress tie-break rules
      const at = diffRng() < 0.35 ? sharedAt : Math.floor(diffRng() * 25);
      const bt = diffRng() < 0.35 ? sharedBt : 1 + Math.floor(diffRng() * 12);
      const pr = diffRng() < 0.35 ? sharedPr : 1 + Math.floor(diffRng() * 8);
      procs.push({ pid: 'P' + (i + 1), at, bt, pr });
    }

    // Permute/shuffle array to test unordered inputs
    for (let i = procs.length - 1; i > 0; i--) {
      const j = Math.floor(diffRng() * (i + 1));
      [procs[i], procs[j]] = [procs[j], procs[i]];
    }

    const quantum = 1 + Math.floor(diffRng() * 6); // quantum 1 to 6
    const lowerIsHigher = diffRng() < 0.5; // both priority conventions
    const options = { quantum, lowerIsHigher };

    for (const alg of diffAlgorithms) {
      const rRef = Ref[alg](procs, options);
      const rEng = Sched[alg](procs, options);

      const gRef = rRef.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end }));
      const gEng = rEng.gantt.map(g => ({ pid: g.pid, start: g.start, end: g.end }));

      try {
        // 1. Identical Gantt segments (after merging adjacent same-pid ticks)
        assert.deepStrictEqual(gRef, gEng, `Gantt segments mismatch in ${alg}`);

        // 2. Identical context switch counts
        assert.strictEqual(
          rRef.contextSwitches,
          rEng.contextSwitches,
          `Context switch count mismatch in ${alg} (ref=${rRef.contextSwitches}, eng=${rEng.contextSwitches})`
        );

        // 3. Identical CT, TAT, WT, RT per process
        for (const p of procs) {
          const ppRef = rRef.perProcess[p.pid];
          const ppEng = rEng.perProcess[p.pid];
          assert.strictEqual(ppRef.ct, ppEng.ct, `CT mismatch for ${p.pid} in ${alg}`);
          assert.strictEqual(ppRef.tat, ppEng.tat, `TAT mismatch for ${p.pid} in ${alg}`);
          assert.strictEqual(ppRef.wt, ppEng.wt, `WT mismatch for ${p.pid} in ${alg}`);
          assert.strictEqual(ppRef.rt, ppEng.rt, `RT mismatch for ${p.pid} in ${alg}`);
        }
      } catch (err) {
        console.error('\n================================================================');
        console.error(`FIRST MISMATCH DETECTED ON TRIAL ${trial + 1} FOR ${alg}`);
        console.error('================================================================');
        console.error('Input Process Set:');
        console.error(JSON.stringify(procs, null, 2));
        console.error('Options:');
        console.error(JSON.stringify(options, null, 2));
        console.error('Reference Gantt:');
        console.error(JSON.stringify(gRef, null, 2));
        console.error('Engine Gantt:');
        console.error(JSON.stringify(gEng, null, 2));
        console.error(`Reference Context Switches: ${rRef.contextSwitches}`);
        console.error(`Engine Context Switches: ${rEng.contextSwitches}`);
        console.error('Reference perProcess:');
        console.error(JSON.stringify(rRef.perProcess, null, 2));
        console.error('Engine perProcess:');
        console.error(JSON.stringify(rEng.perProcess, null, 2));
        console.error('Error Details:', err.message);
        console.error('================================================================\n');
        throw err;
      }
    }
  }
});

const suiteDurationMs = Date.now() - suiteStartTime;

console.log('\n================================================================');
console.log(`TEST SUITE RESULTS: ${passedTests}/${totalTests} passed, ${failedTests} failed.`);
console.log(`Execution Time: ${suiteDurationMs}ms`);
console.log('================================================================\n');

if (failedTests > 0) {
  console.error(`ERROR: ${failedTests} test(s) failed.\n`);
  failureDetails.forEach((f, idx) => {
    console.error(`[${idx + 1}] ${f.description}:`);
    console.error(`    ${f.err.stack || f.err.message}\n`);
  });
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! ZERO FAILURES.\n');
  process.exit(0);
}
