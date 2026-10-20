# CPU Scheduling Algorithm Simulator (Problem Statement 55)

> **Operating Systems Coursework Project**  
> **Problem Statement 55:** *"Compare average turnaround times of all algorithms on a single process set and highlight the best."*

An interactive, production-grade CPU scheduling simulator and pedagogical tool. Built strictly with vanilla HTML5, CSS3, and JavaScript—zero external frameworks, zero external charting libraries, and zero runtime dependencies.

---

## 🚀 Quick Start

### 1. Running the Web Application
No build steps, bundlers, or package installations are needed. Simply open `index.html` in any modern web browser:

- **Direct Browser Launch:**
  Double-click `index.html`, or right-click and open with your preferred browser (Chrome, Firefox, Edge, Safari).
- **Using a Local Static Server (Optional):**
  ```bash
  # Using Node.js npx
  npx serve .

  # Using Python
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000`.

### 2. Running the Automated Test Suite
The project includes a comprehensive, dual-layer verification test suite powered by plain Node.js `assert`:

```bash
# Run the complete test suite (Classic set, edge cases, 500 invariant sets, 2,000 differential sets)
node tests/engine.test.js

# Run the independent naive tick-by-tick reference self-test
node tests/reference.js
```

---

## 📁 Repository Structure

```text
├── index.html            # Main single-page application structure & UI layout
├── style.css             # Vanilla CSS design system (Dark & Light themes, animations, mobile CSS)
├── engine.js             # Pure, decoupled CPU scheduling engine (browser & Node.js compatible)
├── ui.js                 # UI controller, SVG chart generator, dry run animator, CSV exporter
├── VIVA_NOTES.md         # Comprehensive viva voce guide, formulas, theory & hand-worked dry runs
├── README.md             # Project documentation, architecture, and run instructions
└── tests/
    ├── engine.test.js    # 26-suite verification test harness (12,000+ simulation checks)
    └── reference.js      # Independent naive tick-by-tick reference implementation
```

---

## 🧠 Supported Scheduling Algorithms

All 6 algorithms strictly implement the Problem Statement 55 specification, academic tie-breaking rules, and context-switch conventions:

1. **First-Come, First-Served (FCFS)** — Non-preemptive, order by arrival time, then PID.
2. **Shortest Job First (SJF)** — Non-preemptive, order by smallest initial burst time, then arrival, then PID.
3. **Shortest Remaining Time First (SRTF)** — Preemptive SJF, evaluates at every clock tick. *Strict non-preemption on tie*.
4. **Priority Scheduling (Non-Preemptive)** — Non-preemptive, order by priority (configurable lower/higher is best).
5. **Priority Scheduling (Preemptive)** — Preemptive priority, interrupts running process strictly if an arrived job has higher priority.
6. **Round Robin (RR)** — Preemptive time-slicing with user-defined quantum ($q \ge 1$). Enqueues new arrivals first, preempted jobs second.

---

## 🎯 Key Application Features

### 1. Comparison & Leaderboard (Core of Problem Statement 55)
- **Ranked Leaderboard Table:** Ranks all 6 algorithms by Average Turnaround Time ($\text{Avg } TAT$). Ties correctly share rank.
- **Pure SVG Bar Chart:** Color-coded comparison chart with the winning algorithm highlighted in gold. Built from scratch with zero third-party chart libraries.
- **Per-Process Matrix:** Side-by-side turnaround breakdown showing how each process performed under each algorithm.

### 2. Step-by-Step Dry Run Simulation Inspector
- **Playback Controls:** Play, pause, step forward, step backward, or jump to any clock instant.
- **Adjustable Speed:** Slider control from slow step-by-step ($1500\text{ms}$) to high-speed ($200\text{ms}$).
- **Synchronized State Dashboard:** Live-revealed Gantt chart, CPU status chip, FIFO ready queue badges, remaining burst progress bars, and real-time decision reasoning audit log.

### 3. Student Prediction Challenge
- Allows students to predict which algorithm will win before running the simulation.
- Immediately evaluates predictions with congratulatory or corrective feedback.

### 4. Interactive Configuration & Presets
- **Presets Included:**
  - *Classic Test Set (Problem Statement 55):* Demonstrates SRTF superiority ($13.00$ vs $13.50, 14.25, 15.25, 20.00$).
  - *CPU Idle Gaps:* Illustrates hatched IDLE intervals and context switch neutrality across gaps.
  - *Convoy Effect ($AT=0$):* Demonstrates FCFS head-of-line blocking.
  - *Heavy Ties:* Stresses alphanumeric PID tie-breaking.
- **Custom Input Table:** Add, delete, and edit process rows ($PID, AT, BT, PR$) with real-time validation.
- **Random Set Generator:** Generates random, valid process workloads at the click of a button.

### 5. Reporting & Export
- **CSV Export:** Generates formatted `.csv` reports containing inputs, rankings, and detailed per-process metrics.
- **Print / PDF Friendly:** Includes dedicated CSS print stylesheet for clean exam or lab submissions.
- **Theme Toggle:** Supports seamless switching between dark mode and light mode.
- **Fully Responsive:** Tested and verified on desktop, tablet, and mobile viewports (390px width).

---

## 🧪 Testing & Verification Architecture

The test suite in [`tests/engine.test.js`](tests/engine.test.js) guarantees mathematical correctness through four testing tiers:

1. **Spec Verification (Classic Set):**
   Validates exact expected metrics on Problem Statement 55's classic workload:
   - SRTF: $\text{Avg } TAT = 13.00, \text{Context Switches} = 4$
   - Priority Preemptive: $\text{Avg } TAT = 13.50, \text{Context Switches} = 4$
   - SJF: $\text{Avg } TAT = 14.25, \text{Context Switches} = 3$
   - Priority Non-Preemptive: $\text{Avg } TAT = 14.25, \text{Context Switches} = 3$
   - FCFS: $\text{Avg } TAT = 15.25, \text{Context Switches} = 3$
   - Round Robin ($q=3$): $\text{Avg } TAT = 20.00, \text{Context Switches} = 9$
   - Full Gantt segment verification for SRTF and Round Robin.

2. **Edge Cases:**
   Single process; all arrive at $t=0$; initial CPU idle gap; idle gap in the middle; identical burst times; identical priorities; quantum = 1; huge quantum (RR matches FCFS); PID tie-breaks ($P_1 < P_2$ and $P_2 < P_{10}$); unsorted input order; non-mutation; and robust input validation.

3. **Randomized Invariants (500 Sets):**
   Validates 9 core operating system invariants across 3,000 algorithmic simulations:
   - Total busy time equals sum of bursts
   - No Gantt overlaps or negative durations; contiguous timeline
   - $CT \ge AT + BT$, $TAT \ge BT$, $WT \ge 0$
   - $\sum (\text{Gantt durations per PID}) = BT$
   - $\text{SRTF Avg } TAT \le \text{SJF Avg } TAT$
   - $\text{SRTF Avg } WT \le \text{Algorithm Avg } WT$
   - $\text{Round Robin}(\text{huge } q) \equiv \text{FCFS}$

4. **Differential Fuzzing (2,000 Sets / 12,000 Simulations):**
   Compares [`engine.js`](engine.js) against [`tests/reference.js`](tests/reference.js) (a naive, tick-by-tick simulator with zero shortcuts) across 2,000 pseudo-random process sets containing idle gaps, 35% injected ties, variable quantum, and toggled priority rules. Asserts 100% identical Gantt segments, $CT, TAT, WT, RT$, and context switch counts.

---

## 📖 Viva Preparation

For detailed formula derivations, theoretical proofs (why SRTF minimizes average TAT), hand-worked dry runs, and 15 viva voce questions with concise answers, consult [`VIVA_NOTES.md`](VIVA_NOTES.md).
