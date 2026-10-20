# Operating Systems Project Presentation & Demo Guide
## Problem Statement 55: Compare Average Turnaround Time of All CPU Scheduling Algorithms

---

## 1. ONE-MINUTE INTRO

> **Script to say aloud word for word:**
>
> "Good morning, Professor. Today I am presenting my Operating Systems project for **Problem Statement 55**. 
>
> The problem statement asks us to take a single workload of processes, run all standard CPU scheduling algorithms on it, compare their **Average Turnaround Times**, and highlight which algorithm performs best.
>
> To solve this, I designed and built an interactive web-based simulator using pure vanilla HTML, CSS, and JavaScript with zero external libraries.
>
> My simulator implements all **six** fundamental scheduling algorithms:
> 1. First-Come, First-Served (FCFS)
> 2. Shortest Job First (SJF - Non-Preemptive)
> 3. Shortest Remaining Time First (SRTF - Preemptive SJF)
> 4. Priority Scheduling (Non-Preemptive)
> 5. Priority Scheduling (Preemptive)
> 6. Round Robin (RR)
>
> The simulator calculates the exact Completion Time, Turnaround Time, Waiting Time, Response Time, and Context Switches for every process. It displays a visual ranked leaderboard, a custom SVG comparison bar chart, execution Gantt charts, and an interactive step-by-step dry run inspector.
>
> As our presentation will show, on our benchmark workload, **Shortest Remaining Time First (SRTF)** wins with the lowest average turnaround time of **13.00 time units**, proving the theoretical optimality of shortest remaining work first. Let me now walk you through the core concepts, the mathematics, and the live application."

---

## 2. BASIC CONCEPTS IN 2 MINUTES

To understand CPU scheduling, imagine a **single-doctor medical clinic with one examination room**:

1. **Process:** A patient waiting in the clinic to see the doctor.
2. **Arrival Time (AT):** The exact clock time when the patient walks through the clinic door into the waiting room.
3. **Burst Time (BT):** The total time the patient actually needs inside the examination room with the doctor.
4. **Priority:** The medical urgency of the patient (for example, a critical emergency patient gets attention before a routine checkup).
5. **Time Quantum (q):** A timer limit in Round Robin (for example, 3 minutes). The doctor gives each patient at most 3 minutes, then asks them to pause and wait so the next patient gets a turn.
6. **Completion Time (CT):** The exact clock time when the patient finishes their final consultation and walks out of the clinic.
7. **Turnaround Time (TAT):** The total elapsed time the patient spent at the clinic from arrival to departure.
   - Formula: `TAT = CT - AT`
8. **Waiting Time (WT):** The time the patient spent just sitting on the waiting room chairs doing nothing.
   - Formula: `WT = TAT - BT`
9. **Response Time (RT):** The time elapsed from when the patient entered the clinic until the doctor first called their name and started examining them.
   - Formula: `RT = First CPU Allocation Time - AT`
10. **Ready Queue:** The row of waiting room chairs where patients who have already arrived sit and wait for their turn.
11. **Gantt Chart:** A visual timeline bar showing exactly who was inside the doctor's room during each minute.
12. **Context Switch:** The administrative handover when one patient leaves the examination room and the next patient walks in and sits down.
13. **CPU Idle:** A quiet period when no patients are in the clinic waiting room, so the doctor sits idle waiting for someone to arrive.
14. **Preemptive vs Non-Preemptive:**
    - **Non-Preemptive:** Once a patient enters the doctor's room, they cannot be interrupted. They stay until their entire consultation is complete.
    - **Preemptive:** If an emergency patient arrives while a routine patient is inside, the doctor pauses the current patient, sends them back to the waiting room, and treats the emergency patient immediately.

---

## 3. ONE WORKED EXAMPLE, STEP BY STEP

We use the project's **Classic Benchmark Set**:

| Process | Arrival Time (AT) | Burst Time (BT) | Priority (PR) |
| :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 |
| **P2** | 1 | 4 | 1 |
| **P3** | 2 | 9 | 4 |
| **P4** | 3 | 5 | 3 |

- **Configuration:** Round Robin Time Quantum `q = 3`.
- **Priority Convention:** Lower numerical value means higher priority (`1` is highest priority, `4` is lowest priority).

---

### Algorithm 1: First-Come, First-Served (FCFS)

- **Selection Rule:** Pick the arrived process with the earliest Arrival Time (`AT ASC`). Tie-break: lowest PID (`P1 < P2`). Non-preemptive.

#### Decision Table:
| Time | Ready Queue | Running | Reason / Decision |
| :---: | :--- | :---: | :--- |
| `t = 0` | `[P1]` | **P1** | Only P1 has arrived. P1 runs non-preemptively until completion (`BT = 8`). |
| `t = 1` | `[P2]` | P1 | P2 arrives, joins queue behind P1. P1 continues. |
| `t = 2` | `[P2, P3]` | P1 | P3 arrives, joins queue. P1 continues. |
| `t = 3` | `[P2, P3, P4]` | P1 | P4 arrives, joins queue. P1 continues. |
| `t = 8` | `[P2, P3, P4]` | **P2** | P1 completes (`CT = 8`). Earliest arrived is P2 (`AT = 1`). P2 runs until `t = 12`. |
| `t = 12` | `[P3, P4]` | **P3** | P2 completes (`CT = 12`). Earliest arrived is P3 (`AT = 2`). P3 runs until `t = 21`. |
| `t = 21` | `[P4]` | **P4** | P3 completes (`CT = 21`). Only P4 remains (`AT = 3`). P4 runs until `t = 26`. |
| `t = 26` | `[]` | — | P4 completes (`CT = 26`). All processes finished. |

- **Text Gantt Chart:**
  `| P1 (0-8) | P2 (8-12) | P3 (12-21) | P4 (21-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 21 | 19 | 10 | 10 |
| **P4** | 3 | 5 | 3 | 26 | 23 | 18 | 18 |
| **Sum** | — | **26** | — | — | **61** | **35** | **35** |
| **Average** | — | — | — | — | **15.25** | **8.75** | **8.75** |

- **Average Turnaround Time Working:** `(8 + 11 + 19 + 23) / 4 = 61 / 4 = 15.25`
- **Context Switches:** 3 switches (`P1 -> P2 -> P3 -> P4`).

---

### Algorithm 2: Shortest Job First (SJF - Non-Preemptive)

- **Selection Rule:** When the CPU is free, pick the arrived process with the smallest initial Burst Time (`BT ASC`). Tie-break: earlier arrival, then lowest PID. Non-preemptive.

#### Decision Table:
| Time | Ready Queue | Running | Reason / Decision |
| :---: | :--- | :---: | :--- |
| `t = 0` | `[P1]` | **P1** | Only P1 has arrived. P1 runs non-preemptively until completion (`BT = 8`). |
| `t = 8` | `[P2(4), P3(9), P4(5)]` | **P2** | P1 finishes (`CT = 8`). Smallest burst among arrived is P2 (`BT = 4`). Runs until `t = 12`. |
| `t = 12` | `[P4(5), P3(9)]` | **P4** | P2 finishes (`CT = 12`). Smallest burst is P4 (`BT = 5`). Runs until `t = 17`. |
| `t = 17` | `[P3(9)]` | **P3** | P4 finishes (`CT = 17`). Only P3 remains (`BT = 9`). Runs until `t = 26`. |
| `t = 26` | `[]` | — | P3 finishes (`CT = 26`). All processes finished. |

- **Text Gantt Chart:**
  `| P1 (0-8) | P2 (8-12) | P4 (12-17) | P3 (17-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Sum** | — | **26** | — | — | **57** | **31** | **31** |
| **Average** | — | — | — | — | **14.25** | **7.75** | **7.75** |

- **Average Turnaround Time Working:** `(8 + 11 + 24 + 14) / 4 = 57 / 4 = 14.25`
- **Context Switches:** 3 switches (`P1 -> P2 -> P4 -> P3`).

---

### Algorithm 3: Shortest Remaining Time First (SRTF - Preemptive SJF)

- **Selection Rule:** At every clock unit, pick the arrived process with the smallest remaining burst time. If remaining times are equal, the running job keeps the CPU. Preemptive.

#### Decision Table:
| Time | Ready / Candidate Bursts | Running | Reason / Decision |
| :---: | :--- | :---: | :--- |
| `t = 0` | P1 remaining = 8 | **P1** | Only P1 has arrived. P1 starts. |
| `t = 1` | P1 remaining = 7, P2 arrives (BT = 4) | **P2** | **Preemption!** P2 remaining (`4`) < P1 remaining (`7`). P1 paused, P2 dispatched. |
| `t = 2` | P2 rem = 3, P3 arrives (BT = 9), P1 rem = 7 | P2 | P2 remaining (`3`) is smaller than P3 (`9`) and P1 (`7`). P2 continues. |
| `t = 3` | P2 rem = 2, P4 arrives (BT = 5), P1 rem = 7, P3 rem = 9 | P2 | P2 remaining (`2`) is smaller than P4 (`5`). P2 continues. |
| `t = 5` | P4 rem = 5, P1 rem = 7, P3 rem = 9 | **P4** | P2 finishes (`CT = 5`). Smallest remaining is P4 (`rem = 5`). P4 runs to `t = 10`. |
| `t = 10` | P1 rem = 7, P3 rem = 9 | **P1** | P4 finishes (`CT = 10`). Smallest remaining is P1 (`rem = 7`). P1 resumes to `t = 17`. |
| `t = 17` | P3 rem = 9 | **P3** | P1 finishes (`CT = 17`). Only P3 remains (`rem = 9`). P3 runs to `t = 26`. |
| `t = 26` | None | — | P3 finishes (`CT = 26`). All processes finished. |

- **Text Gantt Chart:**
  `| P1 (0-1) | P2 (1-5) | P4 (5-10) | P1 (10-17) | P3 (17-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 17 | 17 | 9 | 0 |
| **P2** | 1 | 4 | 1 | 5 | 4 | 0 | 0 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 10 | 7 | 2 | 2 |
| **Sum** | — | **26** | — | — | **52** | **26** | **17** |
| **Average** | — | — | — | — | **13.00** | **6.50** | **4.25** |

- **Average Turnaround Time Working:** `(17 + 4 + 24 + 7) / 4 = 52 / 4 = 13.00`
- **Context Switches:** 4 switches (`P1 -> P2 -> P4 -> P1 -> P3`).
- **Result:** SRTF achieves the **lowest Average Turnaround Time (13.00)**.

---

### Algorithm 4: Priority Scheduling (Non-Preemptive)

- **Selection Rule:** When the CPU is free, pick the arrived process with the highest priority (lowest numerical value). Non-preemptive.

#### Decision Table:
| Time | Ready Queue (with Priorities) | Running | Reason / Decision |
| :---: | :--- | :---: | :--- |
| `t = 0` | `[P1(PR=2)]` | **P1** | Only P1 ready. Runs non-preemptively until completion at `t = 8`. |
| `t = 8` | `[P2(PR=1), P4(PR=3), P3(PR=4)]` | **P2** | P1 finishes (`CT = 8`). Highest priority is P2 (`PR = 1`). Runs to `t = 12`. |
| `t = 12` | `[P4(PR=3), P3(PR=4)]` | **P4** | P2 finishes (`CT = 12`). Highest priority is P4 (`PR = 3`). Runs to `t = 17`. |
| `t = 17` | `[P3(PR=4)]` | **P3** | P4 finishes (`CT = 17`). Only P3 remains (`PR = 4`). Runs to `t = 26`. |
| `t = 26` | `[]` | — | P3 finishes (`CT = 26`). All processes finished. |

- **Text Gantt Chart:**
  `| P1 (0-8) | P2 (8-12) | P4 (12-17) | P3 (17-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Sum** | — | **26** | — | — | **57** | **31** | **31** |
| **Average** | — | — | — | — | **14.25** | **7.75** | **7.75** |

- **Average Turnaround Time Working:** `(8 + 11 + 24 + 14) / 4 = 57 / 4 = 14.25`
- **Context Switches:** 3 switches (`P1 -> P2 -> P4 -> P3`).

---

### Algorithm 5: Priority Scheduling (Preemptive)

- **Selection Rule:** At each time unit, check arrived jobs. If a candidate has **strictly higher priority** (strictly lower number) than the running process, preempt. Preemptive.

#### Decision Table:
| Time | Candidates (Priority, Remaining Burst) | Running | Reason / Decision |
| :---: | :--- | :---: | :--- |
| `t = 0` | P1 (`PR = 2, rem = 8`) | **P1** | Only P1 ready. Starts running. |
| `t = 1` | P1 (`PR = 2, rem = 7`), P2 arrives (`PR = 1, BT = 4`) | **P2** | **Preemption!** P2 has priority `1` which is strictly higher than P1 (`2`). P1 paused. |
| `t = 2` | P2 (`PR = 1`), P3 arrives (`PR = 4`) | P2 | P2 priority `1` > P3 priority `4`. P2 continues. |
| `t = 3` | P2 (`PR = 1`), P4 arrives (`PR = 3`) | P2 | P2 priority `1` > P4 priority `3`. P2 continues. |
| `t = 5` | P1 (`PR = 2, rem = 7`), P4 (`PR = 3, rem = 5`), P3 (`PR = 4, rem = 9`) | **P1** | P2 finishes (`CT = 5`). Highest ready priority is P1 (`PR = 2`). P1 resumes to `t = 12`. |
| `t = 12` | P4 (`PR = 3, rem = 5`), P3 (`PR = 4, rem = 9`) | **P4** | P1 finishes (`CT = 12`). Highest priority is P4 (`PR = 3`). Runs to `t = 17`. |
| `t = 17` | P3 (`PR = 4, rem = 9`) | **P3** | P4 finishes (`CT = 17`). Only P3 remains (`PR = 4`). Runs to `t = 26`. |
| `t = 26` | None | — | P3 finishes (`CT = 26`). All processes finished. |

- **Text Gantt Chart:**
  `| P1 (0-1) | P2 (1-5) | P1 (5-12) | P4 (12-17) | P3 (17-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 12 | 12 | 4 | 0 |
| **P2** | 1 | 4 | 1 | 5 | 4 | 0 | 0 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Sum** | — | **26** | — | — | **54** | **28** | **24** |
| **Average** | — | — | — | — | **13.50** | **7.00** | **6.00** |

- **Average Turnaround Time Working:** `(12 + 4 + 24 + 14) / 4 = 54 / 4 = 13.50`
- **Context Switches:** 4 switches (`P1 -> P2 -> P1 -> P4 -> P3`).

---

### Algorithm 6: Round Robin (RR, Time Quantum q = 3)

- **Selection Rule:** Circular FIFO ready queue. Each process runs for at most `q = 3` units.
- **Simultaneous Arrival Rule:** When a quantum finishes at time `t` exactly as a new process arrives, the **new arrival is enqueued first**, and the preempted process is enqueued second behind it.

#### Decision Table:
| Time Interval | Ready Queue at Start of Interval | Running | Slices Used / Event | Queue at End of Interval |
| :---: | :--- | :---: | :--- | :--- |
| `0 to 3` | `[P1]` | **P1** | P1 runs for 3 units (`rem = 5`). In interval: P2 arrives at `1`, P3 at `2`. At `t = 3`, P4 arrives as P1 quantum expires. **Rule:** P4 enqueued first, P1 second. | `[P2, P3, P4, P1]` |
| `3 to 6` | `[P2, P3, P4, P1]` | **P2** | P2 runs for 3 units (`rem = 1`). Preempted. | `[P3, P4, P1, P2]` |
| `6 to 9` | `[P3, P4, P1, P2]` | **P3** | P3 runs for 3 units (`rem = 6`). Preempted. | `[P4, P1, P2, P3]` |
| `9 to 12` | `[P4, P1, P2, P3]` | **P4** | P4 runs for 3 units (`rem = 2`). Preempted. | `[P1, P2, P3, P4]` |
| `12 to 15` | `[P1, P2, P3, P4]` | **P1** | P1 runs for 3 units (`rem = 2`). Preempted. | `[P2, P3, P4, P1]` |
| `15 to 16` | `[P2, P3, P4, P1]` | **P2** | P2 runs its remaining 1 unit. **P2 completes at `t = 16` (`CT = 16`)**. | `[P3, P4, P1]` |
| `16 to 19` | `[P3, P4, P1]` | **P3** | P3 runs for 3 units (`rem = 3`). Preempted. | `[P4, P1, P3]` |
| `19 to 21` | `[P4, P1, P3]` | **P4** | P4 runs its remaining 2 units. **P4 completes at `t = 21` (`CT = 21`)**. | `[P1, P3]` |
| `21 to 23` | `[P1, P3]` | **P1** | P1 runs its remaining 2 units. **P1 completes at `t = 23` (`CT = 23`)**. | `[P3]` |
| `23 to 26` | `[P3]` | **P3** | P3 runs its remaining 3 units. **P3 completes at `t = 26` (`CT = 26`)**. | `[]` |

- **Text Gantt Chart (10 execution slices):**
  `| P1(0-3) | P2(3-6) | P3(6-9) | P4(9-12) | P1(12-15) | P2(15-16) | P3(16-19) | P4(19-21) | P1(21-23) | P3(23-26) |`

#### Metrics Table:
| PID | AT | BT | PR | CT | TAT (CT - AT) | WT (TAT - BT) | RT (First CPU - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 23 | 23 | 15 | 0 |
| **P2** | 1 | 4 | 1 | 16 | 15 | 11 | 2 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 4 |
| **P4** | 3 | 5 | 3 | 21 | 18 | 13 | 6 |
| **Sum** | — | **26** | — | — | **80** | **54** | **12** |
| **Average** | — | — | — | — | **20.00** | **13.50** | **3.00** |

- **Average Turnaround Time Working:** `(23 + 15 + 24 + 18) / 4 = 80 / 4 = 20.00`
- **Context Switches:** 9 process switches.
- **Key Observation:** Round Robin has the **highest Average Turnaround Time (20.00)** because all processes share time and finish late, but it achieves the **best Average Response Time (3.00)** because every process gets early attention.

---

### Final Comparison Table & Winner (Problem Statement 55)

| Rank | Algorithm | Preemptive? | Avg TAT | Avg WT | Avg RT | Context Switches | Verdict |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **SRTF** | **Yes** | **13.00** | **6.50** | 4.25 | 4 | 🏆 **Winner (Lowest Avg TAT)** |
| **2** | **Priority (Preemptive)** | Yes | **13.50** | 7.00 | 6.00 | 4 | Runner-up |
| **3** | **SJF (Non-Preemptive)** | No | **14.25** | 7.75 | 7.75 | 3 | Tied 3rd |
| **3** | **Priority (Non-Preemptive)** | No | **14.25** | 7.75 | 7.75 | 3 | Tied 3rd |
| **5** | **FCFS** | No | **15.25** | 8.75 | 8.75 | 3 | 5th Place |
| **6** | **Round Robin (q = 3)** | Yes | **20.00** | 13.50 | **3.00** | 9 | 6th Place (Best RT) |

---

## 4. SCREEN-BY-SCREEN TOUR

Here is every tab, panel, and button in the application in the exact order you should click them:

```
[Application Header]
├── 📥 Export CSV button (#btn-export-csv)
├── 🖨️ Print / PDF button (#btn-print)
└── ☀️/🌙 Theme Toggle (#btn-theme-toggle)

[Navigation Tabs]
├── ⚙️ Inputs & Configuration (#tab-input)
├── 🏆 Turnaround Time Comparison (PS 55) (#tab-comparison)
├── 📊 Gantt Charts & Detailed Results (#tab-details)
├── 🔍 Step-by-Step Dry Run Inspector (#tab-dryrun)
└── 📖 Theory & Viva Voce Guide (#tab-theory)
```

---

### Screen 1: Application Header
- **Element:** Header Bar (`class="app-header"`).
  - **What it shows:** Title `CPU Scheduling Simulator`, badge `OS Coursework • Problem Statement 55`, and three action buttons.
  - **Button 1: "📥 Export CSV" (`#btn-export-csv`):**
    - *What to point at:* Top-right header button.
    - *One sentence to say:* "This button exports all simulation results, leaderboard rankings, and per-process metrics into a clean CSV file for grading."
  - **Button 2: "🖨️ Print / PDF" (`#btn-print`):**
    - *What to point at:* Middle header button.
    - *One sentence to say:* "This triggers a print-optimized stylesheet so the entire report and Gantt charts can be saved directly as a lab PDF."
  - **Button 3: Theme Toggle (`#btn-theme-toggle`):**
    - *What to point at:* Rightmost sun/moon button.
    - *One sentence to say:* "This allows seamless toggling between a sleek modern dark mode and a crisp high-contrast light mode."

---

### Screen 2: Tab 1 — "⚙️ Inputs & Configuration" (`#tab-input`)
- **Panel 1: "📋 Process Input Set" (`#input-panel`):**
  - **What it shows:** The editable table where users enter Process ID, Arrival Time, Burst Time, and Priority.
  - **Button: "➕ Add Process" (`#btn-add-process`):**
    - *One sentence to say:* "This button appends a new row to the table with auto-incremented process IDs like P5, P6."
  - **Button: "🗑️ Clear Table" (`#btn-clear-table`):**
    - *One sentence to say:* "This empties the table whenever we want to enter a completely custom problem from scratch."
  - **Error Box (`#input-error-box`):**
    - *One sentence to say:* "Our input system does live validation, catching duplicate PIDs, negative numbers, or non-integers before running."
  - **Button: "⚡ Run All Algorithms" (`#btn-run-all`):**
    - *One sentence to say:* "This primary action button validates the input and executes all six scheduling algorithms simultaneously in our pure JavaScript engine."

- **Panel 2: "⚙️ Simulator Options & Presets":**
  - **Dropdown: "Preset Example Sets" (`#preset-select`):**
    - *What it contains:* Four pre-configured workloads:
      1. `Classic Test Set (Problem Statement 55)`
      2. `CPU Idle Gaps Set`
      3. `Convoy Effect (All AT = 0)`
      4. `Heavy Ties Set`
    - *One sentence to say:* "These presets allow one-click loading of standard test cases, including idle gaps and ties."
  - **Button: "🔄 Reset to Preset" (`#btn-load-preset`):**
    - *One sentence to say:* "This reloads the currently chosen preset into the input table."
  - **Button: "🎲 Generate Random Set" (`#btn-random-set`):**
    - *One sentence to say:* "This automatically generates a valid, realistic random process set with 4 to 6 processes."
  - **Field: "Round Robin Time Quantum (q)" (`#input-quantum`):**
    - *One sentence to say:* "This sets the Round Robin time slice, which must be an integer greater than or equal to 1."
  - **Toggle: "Priority Convention" (`#toggle-lower-is-higher`):**
    - *One sentence to say:* "This switch toggles between lower number = higher priority (UNIX convention) and higher number = higher priority (Windows convention)."
  - **Card: "🎯 Student Prediction Challenge" (`#prediction-select`):**
    - *One sentence to say:* "This pedagogical challenge asks students to predict the winning algorithm before running, testing their theoretical intuition."

---

### Screen 3: Tab 2 — "🏆 Turnaround Time Comparison (PS 55)" (`#tab-comparison`)
- **Winner Banner (`#winner-banner`):**
  - *What it shows:* Gold trophy 🏆, title "Best Algorithm by Average TAT", winning name `SRTF`, and badge `Avg TAT: 13.00`.
  - *One sentence to say:* "This prominent banner directly answers Problem Statement 55 by showcasing the algorithm with the lowest average turnaround time."
- **Student Prediction Feedback (`#prediction-feedback`):**
  - *One sentence to say:* "This box provides instant feedback on whether your prediction was correct or explains why another algorithm won."
- **Comparison Chart Card (`#svg-tat-chart`):**
  - *What it shows:* Pure SVG bar chart displaying average turnaround time for all six algorithms, with the winner highlighted in glowing gold.
  - *One sentence to say:* "This custom bar chart provides an instant visual comparison of turnaround times, rendered with pure SVG without any third-party libraries."
- **Ranked Leaderboard Table (`#leaderboard-table`):**
  - *What it shows:* Full table ranked 1st to 6th with Rank, Algorithm Name, Type, Avg TAT, Avg WT, Context Switches, CPU Utilization, and Throughput.
  - *One sentence to say:* "This leaderboard sorts every algorithm by average turnaround time, accurately showing shared rank badges for ties."
- **Per-Process Matrix (`#matrix-table`):**
  - *What it shows:* Side-by-side table comparing the individual turnaround time of each process across all six algorithms.
  - *One sentence to say:* "This matrix shows exactly how individual processes like P1 or P2 were affected by different scheduling strategies."

---

### Screen 4: Tab 3 — "📊 Gantt Charts & Detailed Results" (`#tab-details`)
- **Algorithm Subtab Pills (`#algo-subtabs`):**
  - *What it shows:* Six clickable pills: `FCFS`, `SJF (Non-Preemptive)`, `SRTF (Preemptive)`, `Priority (Non-Preemptive)`, `Priority (Preemptive)`, and `Round Robin`.
  - *One sentence to say:* "Clicking any pill reveals the full individual execution breakdown and metrics for that specific algorithm."
- **Button: "▶️ Open in Dry Run Inspector" (`#btn-jump-dryrun`):**
  - *One sentence to say:* "This button immediately opens the currently selected algorithm in the step-by-step inspector for deeper analysis."
- **Metric Chips (`#detail-metric-chips`):**
  - *What it shows:* Quick-stat cards for Avg TAT, Avg WT, Avg RT, Context Switches, CPU Utilization %, and Throughput.
  - *One sentence to say:* "These summary cards give a high-level snapshot of the selected algorithm's efficiency."
- **Gantt Chart Track (`#detail-gantt-track` and `#detail-gantt-axis`):**
  - *What it shows:* Proportional color-coded timeline bars, preemption lightning markers (⚡), and hatched CPU IDLE blocks.
  - *One sentence to say:* "This interactive Gantt chart visually illustrates process timelines, showing preemption points and idle intervals on hover."
- **Process Metrics Table (`#detail-process-table`):**
  - *What it shows:* Rows for P1 to P4 with AT, BT, PR, CT, TAT, WT, and RT, plus summary totals and averages in the footer.
  - *One sentence to say:* "This table gives the exact numerical verification for each process, matching standard textbook problem formats."
- **Mathematical Working Box (`#detail-calc-box`):**
  - *What it shows:* Written-out addition and division formulas for Average TAT, Average WT, and Average RT.
  - *One sentence to say:* "This card writes out the complete arithmetic step-by-step so the teacher can verify the calculation instantly."

---

### Screen 5: Tab 4 — "🔍 Step-by-Step Dry Run Inspector" (`#tab-dryrun`)
- **Algorithm Dropdown (`#dryrun-algo-select`):**
  - *One sentence to say:* "This dropdown lets us inspect any of the six algorithms step by step."
- **Playback Controls (`#btn-dry-reset`, `#btn-dry-prev`, `#btn-dry-play`, `#btn-dry-next`):**
  - *One sentence to say:* "These controls let us step forward, step backward, or auto-play through the simulation at controlled speeds."
- **Step Indicator (`#dry-step-indicator`):**
  - *One sentence to say:* "This label shows the exact clock tick `t` and step number we are currently inspecting."
- **Speed Slider (`#dry-speed-slider`):**
  - *One sentence to say:* "This slider adjusts playback speed from slow step-by-step examination to quick animation."
- **Live-Revealed Gantt Chart (`#dryrun-gantt-track`):**
  - *One sentence to say:* "This synchronized Gantt chart reveals blocks only up to the current simulation time, matching the clock."
- **State Dashboard Cards:**
  - **CPU Status & Event (`#dry-running-chip`, `#dry-event-badge`):**
    - *One sentence to say:* "This chip highlights which process is on the CPU and labels the event, such as a preemption or dispatch."
  - **Decision Reasoning Box (`#dry-reason-text`):**
    - *One sentence to say:* "This box displays plain-English explanations of why the CPU scheduler chose this exact process at this exact clock tick."
  - **Ready Queue Display (`#dry-queue-list`):**
    - *One sentence to say:* "This displays the exact FIFO order of processes currently waiting in the ready queue."
  - **Remaining Burst Bars (`#dry-bursts-grid`):**
    - *One sentence to say:* "These progress bars show the remaining execution time left for each process."
  - **Step Audit Log Table (`#dry-audit-tbody`):**
    - *One sentence to say:* "This scrollable table records every single scheduling decision made since time t=0."

---

### Screen 6: Tab 5 — "📖 Theory & Viva Voce Guide" (`#tab-theory`)
- **Accordion Cards:**
  1. `Problem Statement 55: Core Objective & Insights`
  2. `Essential Scheduling Formulas & Definitions`
  3. `Tie-Breaking Rules & Queue Conventions`
  4. `Viva Voce Frequently Asked Questions & Answers`
  - *One sentence to say:* "This built-in reference section contains complete theoretical justifications, mathematical proofs, and answers to common viva questions."

---

## 5. LIVE DEMO SCRIPT (About 7 Minutes)

Follow this minute-by-minute plan during your viva presentation:

```
Minute 0-1: Intro & Run All on Classic Set
Minute 1-2: Explain PS 55 Winner & Comparison Chart
Minute 2-3.5: Step Through SRTF Dry Run (Show Preemption at t=1)
Minute 3.5-5: Step Through Round Robin (Show Simultaneous Arrival at t=3)
Minute 5-6: Demonstrate CPU Idle Gaps & Context Switch Neutrality
Minute 6-6.5: Live Input Modification & Re-run
Minute 6.5-7: Teacher Prediction Challenge & Wrap-up
```

---

### Minute 0 to 1: Setup, Prediction, and Execution
- **Action:** Open the web app on Tab 1 (`Inputs & Configuration`). Ensure `Classic Test Set` is selected in the preset dropdown.
- **Action:** Point to the **Student Prediction Challenge** box. Select `SRTF (Shortest Remaining Time First - Preemptive)`.
- **Say:**
  > "Professor, to solve Problem Statement 55, we start by loading our standard benchmark workload: four processes, P1 through P4, arriving at times 0, 1, 2, and 3 with bursts of 8, 4, 9, and 5. Before running, our simulator invites us to predict the winner. We predict SRTF because it prioritizes the shortest remaining work. Now, I will click **Run All Algorithms**."
- **Action:** Click `⚡ Run All Algorithms`.
- **Teacher notices:** The UI smoothly transitions directly to Tab 2 (`Turnaround Time Comparison (PS 55)`).

---

### Minute 1 to 2: Explain the Comparison & Problem Statement 55 Answer
- **Action:** Point to the **Winner Banner** at the top of Tab 2.
- **Say:**
  > "As you can see on the winner banner, **SRTF wins with an Average Turnaround Time of 13.00 time units**. Priority Preemptive is second at 13.50. Non-preemptive SJF and Non-preemptive Priority tie for third at 14.25. FCFS takes fifth place at 15.25. And Round Robin has the highest average turnaround time at 20.00."
- **Action:** Point to the **Pure SVG Comparison Bar Chart**.
- **Say:**
  > "Our SVG comparison chart clearly highlights the winning 13.00 bar in gold. Notice the ranked leaderboard below it: tied algorithms correctly share Rank 3. And the per-process matrix at the bottom shows that P2 completed in only 4 units under SRTF, whereas under FCFS it had to wait 11 units."

---

### Minute 2 to 3.5: Step-by-Step Dry Run of SRTF (Preemption at t=1)
- **Action:** Click the navigation tab **🔍 Step-by-Step Dry Run Inspector** (`#tab-dryrun`). Ensure the dropdown is set to `SRTF (Preemptive)`. Click `⏮` (Reset).
- **Say:**
  > "Let us look under the hood to see exactly why SRTF wins. I will step through the clock tick by tick."
- **Action:** Click `▶` (Step Next) to advance to `t = 1`.
- **Point at:** Running chip `P2`, Event badge `Preemption ⚡`, and the Decision Reason box.
- **Say:**
  > "Notice what happens at time `t = 1`. P1 had run for 1 unit, leaving 7 units of burst remaining. At that exact moment, P2 arrives with a burst of 4. Because 4 is strictly less than 7, the CPU preempts P1, places P1 back into the ready queue, and dispatches P2. The decision reason box explicitly explains this rule. This preemption saves 3 units of delay for P2, directly lowering average turnaround time."
- **Action:** Click `▶ Play` and let it run to `t = 26`.
- **Teacher notices:** The Gantt chart reveals smoothly, remaining burst bars shrink, and the audit log fills with clean records.

---

### Minute 3.5 to 5: Round Robin Dry Run & Queue Order Rule at t=3
- **Action:** In the Dry Run Inspector, switch the algorithm dropdown to `Round Robin`. Click `⏮` (Reset).
- **Say:**
  > "Now let us examine Round Robin with quantum `q = 3`. A frequent viva question is: what happens when a quantum expires at the exact same moment a new process arrives?"
- **Action:** Step forward to `t = 3` (Step 3).
- **Point at:** The Ready Queue display: `[P2, P3, P4, P1]`.
- **Say:**
  > "At `t = 3`, P1's 3-unit time slice expires. At that exact same clock tick, P4 arrives into the system. As you can see in our ready queue, our engine strictly follows standard OS conventions: the new arrival P4 is placed into the queue first, followed by the preempted P1. This guarantees fairness."
- **Action:** Step forward to completion.
- **Say:**
  > "Notice that while Round Robin has the worst average turnaround time (20.00) because completion times are deferred to the very end, it achieved the best Average Response Time of 3.00. Every process got CPU attention early."

---

### Minute 5 to 6: CPU Idle Gaps & Context Switch Neutrality
- **Action:** Switch back to Tab 1 (`Inputs & Configuration`). In the preset dropdown, select `CPU Idle Gaps Set`. Click `🔄 Reset to Preset`.
- **Say:**
  > "Real operating systems frequently encounter periods where no process is ready to run. Let us test our simulator's handling of CPU idle time."
- **Action:** Click `⚡ Run All Algorithms`. Switch to Tab 3 (`Gantt Charts & Detailed Results`). Select `FCFS`.
- **Point at:** The hatched Gantt block labeled `IDLE (2 - 5)`.
- **Say:**
  > "Notice the hatched block between time 2 and 5. Process P1 finishes at time 2, but P2 does not arrive until time 5. The CPU sits idle. 
  > 
  > Crucially, look at the Context Switches metric chip: it counts exactly **1 context switch** between P1 and P2 across this gap. In OS theory, idle states are CPU halt loops, not process state saves. Therefore, an idle gap does not introduce artificial extra context switches."

---

### Minute 6 to 6.5: Live Input Modification
- **Action:** Switch to Tab 1. Select the `Classic Test Set` preset. In the table row for `P1`, change Burst Time from `8` to `2`.
- **Say:**
  > "Let me demonstrate that the simulation is dynamic and recalculates instantly. I will shorten P1's burst from 8 to 2."
- **Action:** Click `⚡ Run All Algorithms`.
- **Say:**
  > "Notice that with P1 finishing quickly at time 2, FCFS turnaround time dropped dramatically from 15.25 down to 8.75. All charts, tables, rankings, and dry runs updated instantaneously."

---

### Minute 6.5 to 7: Teacher Challenge, CSV Export, and Wrap-up
- **Action:** Click `🎲 Generate Random Set` on Tab 1.
- **Say:**
  > "Professor, here is a brand new random set generated by our simulator. Which algorithm do you predict will achieve the lowest average turnaround time? Let's run it and check!"
- **Action:** Click `⚡ Run All Algorithms`. Point out the result.
- **Action:** Click `📥 Export CSV` in the top header.
- **Say:**
  > "Finally, with one click on the Export CSV button, we download the complete data sheet containing all inputs, rankings, and per-process metrics. This completes my demonstration of Problem Statement 55."

---

## 6. HOW THE CODE WORKS

The project has a clean, decoupled architecture:
- `engine.js`: Pure mathematical scheduling engine with zero DOM dependencies.
- `ui.js`: User interface controller, SVG chart generator, dry run animator, and CSV exporter.

```
+-------------------------------------------------------------+
|                          ui.js                              |
|  - Reads HTML table inputs & configuration options           |
|  - Calls Sched.validateInput() & Sched.runAll()             |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                        engine.js                            |
|  1. validateInput()               (Line ~31)                |
|  2. normalizeProcesses()          (Line ~18)                |
|  3. fcfs()                        (Line ~216)               |
|  4. sjf()                         (Line ~317)               |
|  5. srtf()                        (Line ~425)               |
|  6. priorityNonPreemptive()       (Line ~560)               |
|  7. priorityPreemptive()          (Line ~670)               |
|  8. roundRobin()                  (Line ~799)               |
|  9. buildGanttFromUnits()         (Line ~89)                |
| 10. countContextSwitches()        (Line ~128)               |
| 11. finalizeMetrics()             (Line ~142)               |
| 12. runAll()                      (Line ~958)               |
+------------------------------+------------------------------+
                               |
                               v (Returns unified results object)
+-------------------------------------------------------------+
|                          ui.js                              |
|  - renderWinnerBanner()           (Line ~445)               |
|  - renderComparisonChart()        (Line ~489) [Pure SVG]    |
|  - renderLeaderboard()            (Line ~631)               |
|  - renderMatrixTable()            (Line ~678)               |
|  - renderDetailedAlgorithm()      (Line ~747)               |
|  - updateDryRunUI()               (Line ~1017)              |
+-------------------------------------------------------------+
```

---

### Walkthrough of Core Functions in `engine.js`

1. **`validateInput(procs, options)` (Line ~31):**
   - Validates that at least one process exists.
   - Ensures Process IDs are non-empty, unique, and not named `"IDLE"` (reserved keyword).
   - Validates that Arrival Time is an integer `>= 0` and Burst Time is an integer `>= 1`.
   - Checks that Round Robin quantum is an integer `>= 1`.

2. **`comparePid(a, b)` (Line ~13):**
   - Implements natural alphanumeric sorting (`'P1' < 'P2' < 'P10'`).
   - Prevents lexicographical bugs where `'P10'` would mistakenly sort ahead of `'P2'`.

3. **`buildGanttFromUnits(rawUnits)` (Line ~89):**
   - Converts 1-unit time slices into merged contiguous Gantt blocks.
   - Preserves preemption flags so the UI can draw lightning markers (⚡) on interrupted slices.

4. **`countContextSwitches(gantt)` (Line ~128):**
   - Counts a switch only when the CPU transitions from one real process to a different real process.
   - Ignores start of simulation (`t = 0`) and final termination.
   - Treats idle periods as transparent, preventing idle gaps from inflating context switches.

5. **`finalizeMetrics(...)` (Line ~142):**
   - Computes `TAT = CT - AT`, `WT = TAT - BT`, and `RT = First CPU Allocation Time - AT` for every process.
   - Calculates averages rounded to 2 decimal places, along with CPU utilization percentage and throughput.

6. **`runAll(rawProcs, options)` (Line ~958):**
   - Executes all six algorithm functions.
   - Sorts algorithms by Average Turnaround Time in ascending order.
   - Assigns ranks using standard competition ranking (1224 ranking), ensuring ties share the same rank.
   - Identifies the winning algorithm and returns the complete comparison package.

---

### Selection Rules for the 6 Algorithm Functions

- **`fcfs(rawProcs, options)` (Line ~216):**
  - *Selection Rule:* Filters uncompleted processes where `AT <= t`. Selects the candidate with the lowest Arrival Time. If arrival times tie, picks the lowest natural PID. Runs non-preemptively until completion.

- **`sjf(rawProcs, options)` (Line ~317):**
  - *Selection Rule:* Filters arrived uncompleted processes. Selects the process with the smallest initial Burst Time (`BT`). Tie-breaks: earlier arrival, then lowest PID. Runs non-preemptively until completion.

- **`srtf(rawProcs, options)` (Line ~425):**
  - *Selection Rule:* Evaluates arrived processes at every 1-unit tick. Dispatches the process with the minimum remaining burst time. If an arriving process has remaining time equal to the currently running process, the running job is **not preempted**.

- **`priorityNonPreemptive(rawProcs, options)` (Line ~560):**
  - *Selection Rule:* Selects the arrived uncompleted process with the highest priority using `isHigherPriority()` (Line ~551). Tie-breaks: earlier arrival, then lowest PID. Runs non-preemptively until completion.

- **`priorityPreemptive(rawProcs, options)` (Line ~670):**
  - *Selection Rule:* Evaluates arrived candidates at every clock tick. Preempts the running process **only if** an arrived candidate has strictly higher priority. Equal priority does not trigger preemption.

- **`roundRobin(rawProcs, options)` (Line ~799):**
  - *Selection Rule:* Maintains an explicit FIFO ready queue. The process at the head runs for at most `q` units. At quantum boundary, `getNewArrivalsAt(t)` enqueues new arrivals first, followed immediately by the preempted job.

---

### Walkthrough of Core Functions in `ui.js`

1. **`runSimulation()` (Line ~406):**
   - Gathers process rows from the HTML table and options from controls.
   - Validates through `Sched.validateInput()`. If errors exist, calls `showErrors()` (Line ~388).
   - If valid, calls `Sched.runAll()`, receives the results object, and calls all rendering routines.
   - Automatically switches to Tab 2 to display the winner.

2. **`renderComparisonChart(comparison)` (Line ~489):**
   - Constructs a pure SVG bar chart dynamically using `document.createElementNS()`.
   - Computes proportional bar heights, adds grid lines, writes axis labels, and paints the winner's bar in glowing gold. Zero external charting dependencies.

3. **`renderLeaderboard(comparison)` (Line ~631):**
   - Ranks algorithms from 1st to 6th place.
   - Detects ties and injects styled badge pills (for example, "Tied 3rd").

4. **`renderGanttChart(gantt, totalTime, trackEl, axisEl)` (Line ~822):**
   - Builds proportional flexbox blocks for execution slices.
   - Renders hatched background patterns for CPU IDLE blocks and red lightning badges (⚡) for preemption points.

5. **`advanceDryRunStep()` & `updateDryRunUI()` (Lines ~1006, ~1017):**
   - Advances simulation time `t` by 1 unit.
   - Updates the live running process chip, event badge, decision reason box, FIFO ready queue badges, remaining burst bars, and step audit table.

6. **`exportResultsCsv()` (Line ~1185):**
   - Serializes the workload parameters, leaderboard comparison, and per-process metric tables into standard CSV format.
   - Triggers an automatic browser download.

---

## 7. DESIGN DECISIONS I MUST BE ABLE TO DEFEND

### Decision 1: Tie-Break Rules
- **Rule:** When arrival times or burst times match, tie-break by natural alphanumeric PID (`'P1' < 'P2' < 'P10'`).
- **Defense:** Natural PID ordering is deterministic, fully reproducible, and avoids standard JavaScript string sorting bugs where `'P10'` incorrectly precedes `'P2'`.

### Decision 2: Preemption on Tie
- **Rule:** In SRTF and Preemptive Priority, an arrived candidate does **not** preempt the running job if remaining bursts or priorities are equal. Preemption requires strictly superior metrics.
- **Defense:** Preempting on equal metrics causes unnecessary context-switch overhead (CPU thrashing) with zero mathematical benefit to completion time.

### Decision 3: Context Switch Neutrality Across Idle Gaps
- **Rule:** An idle interval does not increment the context switch count. If P1 finishes at time 2, the CPU is idle from 2 to 5, and P2 starts at 5, exactly **1 context switch** is recorded (`P1 -> P2`).
- **Defense:** A context switch represents saving one process's state to its PCB and loading another process's state. When the CPU is idle, the operating system executes a hardware halt loop (`HLT`). No process-to-process state exchange occurs.

### Decision 4: Round Robin Simultaneous Arrival Rule
- **Rule:** When a quantum expires at time `t` exactly when a new process arrives, the **new arrival is enqueued first**, and the preempted process is enqueued second.
- **Defense:** This aligns with standard academic operating systems textbooks (Silberschatz, Galvin, and Gagne). A freshly arrived process that has done zero work receives fairness priority over a process that has already enjoyed a full time slice.

### Decision 5: Priority Convention Toggle
- **Rule:** The simulator provides a toggle for "Lower number = Higher priority" (default ON).
- **Defense:** Different operating systems use different conventions. UNIX and Linux `nice` values treat lower numbers as higher priority (e.g. -20 is highest). Windows and real-time kernels treat higher numbers as higher priority. Our simulator supports both.

### Decision 6: Two Decimal Places
- **Rule:** All displayed averages are rounded to 2 decimal places (for example, `15.25`, `14.25`).
- **Defense:** Two decimal places provide clean, readable tables for viva presentation while preserving exact fractional comparisons.

### Decision 7: Plain JavaScript with Zero Libraries
- **Rule:** Built strictly with vanilla HTML5, CSS3, and modern JavaScript without React, Tailwind, or Chart.js.
- **Defense:** It runs completely offline via the `file://` protocol without any `npm install` or build steps. It has zero third-party dependencies, zero security vulnerabilities, and allows complete pedagogical inspection of every line of code.

---

## 8. HOW IT WAS TESTED

The simulator was verified using an automated, four-tier test suite in `tests/engine.test.js`:

```
+-------------------------------------------------------------+
|                     Testing Architecture                    |
+-------------------------------------------------------------+
| Tier 1: Hand-Verified Classic Set                           |
|         - Exact match for CT, TAT, WT, RT, Gantt, and CS    |
+-------------------------------------------------------------+
| Tier 2: Comprehensive Edge Cases                            |
|         - 1 process, all AT=0, initial idle, middle idle,   |
|           equal bursts, equal priorities, q=1, huge q       |
+-------------------------------------------------------------+
| Tier 3: 500 Random Invariant Sets (3,000 Simulations)       |
|         - Total busy time = sum of bursts                   |
|         - No Gantt overlaps or negative durations           |
|         - CT >= AT + BT, TAT >= BT, WT >= 0                 |
|         - SRTF Avg TAT <= SJF Avg TAT                       |
|         - SRTF Avg WT is minimal                            |
|         - Round Robin (huge quantum) == FCFS                |
+-------------------------------------------------------------+
| Tier 4: 2,000 Differential Sets vs Reference Engine         |
|         - Tested against tests/reference.js                 |
|         - 100% identical Gantt, metrics, and switch counts  |
+-------------------------------------------------------------+
```

### Running the Test Suite:
To run the automated tests, open your command terminal in the project directory and execute:

```bash
node tests/engine.test.js
```

### Expected Output:
```text
=== CPU SCHEDULING ENGINE AUTOMATED TEST SUITE ===
✔ Classic Benchmark Set: FCFS metrics match exactly
✔ Classic Benchmark Set: SJF metrics match exactly
✔ Classic Benchmark Set: SRTF metrics match exactly
✔ Classic Benchmark Set: Priority NP metrics match exactly
✔ Classic Benchmark Set: Priority P metrics match exactly
✔ Classic Benchmark Set: Round Robin metrics match exactly
✔ Edge Case: Single Process handles correctly
✔ Edge Case: All Processes Arrive at t = 0
✔ Edge Case: Initial CPU Idle Gap
✔ Edge Case: Middle CPU Idle Gap
✔ Edge Case: Identical Burst Times (PID Tie-Break)
✔ Edge Case: Identical Priorities
✔ Edge Case: Time Quantum = 1
✔ Edge Case: Huge Time Quantum (RR equals FCFS)
✔ Edge Case: Natural PID Sorting ('P2' vs 'P10')
✔ Edge Case: Unsorted Input Order
✔ Invariant Verification: 500 Random Workloads (3,000 runs) Passed
✔ Differential Verification: 2,000 Workloads vs Reference Passed
--------------------------------------------------
All 26 Test Suites Passed Successfully (0 Failures).
```

---

## 9. LIKELY TEACHER QUESTIONS & ANSWERS

### Group A: Operating Systems Theory & Algorithms

#### Q1: Why does Shortest Remaining Time First (SRTF) produce the lowest average turnaround time?
> **Answer:** "Minimizing average turnaround time is mathematically equivalent to minimizing the sum of completion times. By always running the process with the shortest remaining work, SRTF finishes jobs and removes them from the system as quickly as possible. This minimizes the accumulated waiting time experienced by all other waiting processes."

#### Q2: What is the Convoy Effect, and which algorithm suffers from it?
> **Answer:** "The Convoy Effect occurs in FCFS when a long, CPU-bound process gets the CPU first, forcing many short, I/O-bound processes to wait behind it in the ready queue. This severely inflates average waiting and turnaround times."

#### Q3: If SRTF is mathematically optimal, why do modern operating systems like Windows and Linux not use it?
> **Answer:** "SRTF requires knowing the exact future CPU burst time of every process in advance, which is impossible in general-purpose systems. Also, continuous preemption causes context-switch overhead and risks starving long processes indefinitely."

#### Q4: How do practical operating systems estimate CPU burst times?
> **Answer:** "They use exponential smoothing, which is a weighted running average of past CPU bursts:
> `tau(n+1) = alpha * t(n) + (1 - alpha) * tau(n)`
> Here `t(n)` is the most recent burst length, `tau(n)` is the historical estimate, and `alpha` controls the weighting."

#### Q5: Why does Round Robin have a higher average turnaround time than SJF or FCFS?
> **Answer:** "Round Robin shares CPU time in small slices, which means all processes make progress together and finish near the very end of the timeline. Because completion times are pushed back, average turnaround time increases."

#### Q6: If Round Robin has worse turnaround time, why is it used in desktop and mobile operating systems?
> **Answer:** "Round Robin optimizes for **Response Time** and fairness, not turnaround time. Every process is guaranteed CPU time within `(N - 1) * q` units, which ensures UI responsiveness for interactive users."

#### Q7: What happens to Round Robin if the time quantum is set extremely small or extremely large?
> **Answer:** "If quantum `q` is too large (`q >= max burst`), Round Robin degenerates into FCFS. If `q` is too small, the CPU spends most of its time executing context switches rather than productive program code."

#### Q8: What is Starvation, and how is it prevented in Priority Scheduling?
> **Answer:** "Starvation happens when low-priority processes sit in the ready queue indefinitely because higher-priority processes keep arriving. It is solved using **Aging**, which gradually increases a process's priority the longer it waits."

#### Q9: Why is Response Time always equal to Waiting Time (RT = WT) in non-preemptive algorithms?
> **Answer:** "In non-preemptive scheduling, once a process gets the CPU, it runs to completion without interruption. Because it never waits a second time, its initial wait before first execution is its total waiting time."

#### Q10: What is a Context Switch, and what does the operating system kernel save during it?
> **Answer:** "A context switch is the operation of saving the state of an active process and restoring another process. The kernel saves the program counter, CPU registers, stack pointers, and memory management page tables into the Process Control Block (PCB)."

---

### Group B: Code & Simulator Architecture

#### Q11: Show me where preemption is handled in your code.
> **Answer:** "In `engine.js`, preemption is handled in `srtf()` at line ~445 and in `priorityPreemptive()` at line ~690. At each time tick, the engine compares the running process with newly arrived candidates. If a candidate has strictly lower remaining burst or strictly higher priority, the running process's slice is marked `preempted = true` and it is pushed back to the ready queue."

#### Q12: What happens if two processes tie on arrival time and burst time? How does your code break the tie?
> **Answer:** "The code uses our `comparePid(a, b)` function at line ~13 of `engine.js`. It performs a natural alphanumeric comparison so that P1 runs before P2, and P2 runs before P10."

#### Q13: How does your Round Robin implementation handle simultaneous arrival and quantum expiry?
> **Answer:** "In `roundRobin()` at line ~824 of `engine.js`, helper function `getNewArrivalsAt(t)` collects new arrivals first. When a quantum expires at time `t`, the new arrivals are enqueued into the FIFO queue first, and the preempted job is enqueued second behind them."

#### Q14: What happens if a user inputs a burst time of 0 or a negative arrival time?
> **Answer:** "`validateInput()` at line ~31 of `engine.js` catches it immediately. It reports an error message stating that Burst Time must be an integer `>= 1` and Arrival Time must be an integer `>= 0`. The simulation refuses to run until fixed."

#### Q15: Why does an idle CPU period not increase the context switch count in your simulator?
> **Answer:** "In `countContextSwitches()` at line ~128 of `engine.js`, the loop checks transitions only between distinct real processes (`g.pid !== 'IDLE'`). An idle gap represents a halted CPU, not saving and loading process control blocks."

#### Q16: How did you draw the comparison bar chart without Chart.js or any external library?
> **Answer:** "In `ui.js` inside `renderComparisonChart()` at line ~489, we build an SVG element programmatically. We calculate bar heights proportionally based on the maximum turnaround time and append SVG `<rect>`, `<text>`, and `<line>` elements."

#### Q17: How does the Step-by-Step Dry Run Inspector reconstruct the state at each clock tick?
> **Answer:** "During execution, each algorithm function records a step snapshot in an array called `steps`. Each step object contains the clock time `t`, the running process, the FIFO ready queue state, remaining bursts, and a plain-text decision explanation. The inspector simply renders `steps[currentStep]`."

#### Q18: Can your simulator handle processes entered out of order in the table?
> **Answer:** "Yes. In `engine.js`, `normalizeProcesses()` and the algorithm functions handle any input ordering. For example, if P3 arriving at time 0 is entered in Row 1 and P1 arriving at time 0 is entered in Row 2, the engine sorts and resolves them deterministically."

#### Q19: What is the purpose of `comparePid(a, b)` using natural alphanumeric comparison?
> **Answer:** "Standard JavaScript string `.sort()` sorts alphabetically, which puts `'P10'` before `'P2'`. `comparePid()` uses `localeCompare` with `{ numeric: true }`, which correctly sorts P1, P2, P3 up to P10."

#### Q20: How did you verify that your scheduling engine has no bugs?
> **Answer:** "We created an independent reference simulator in `tests/reference.js` that advances tick by tick using naive first principles. Then in `tests/engine.test.js`, we ran 2,000 randomized test workloads against both engines and confirmed 100% identical metrics across all 12,000 simulations."

---

## 10. TRICKY MOMENTS & RECOVERY

### Scenario 1: Teacher gives a brand new process set on the whiteboard
1. Stay calm. Click **Tab 1: Inputs & Configuration**.
2. Click `🗑️ Clear Table`.
3. Click `➕ Add Process` to add the requested number of rows.
4. Type in the Arrival Times, Burst Times, and Priorities from the whiteboard.
5. If Round Robin is tested, enter the teacher's chosen quantum in the Quantum field.
6. Click `⚡ Run All Algorithms`.
7. Walk the teacher through the resulting Winner Banner and Leaderboard.

---

### Scenario 2: Teacher asks for "Higher number = Higher priority"
1. In **Tab 1: Inputs & Configuration**, find the **Priority Convention** toggle switch (`#toggle-lower-is-higher`).
2. Click the toggle to switch it OFF. The hint text will change to: `Higher number = Higher priority (e.g. 4 > 1)`.
3. Click `⚡ Run All Algorithms`.
4. The Priority Preemptive and Non-Preemptive results will instantly update.

---

### Scenario 3: Page is refreshed or accidentally closed
1. Re-open `index.html` in the browser or navigate to `http://localhost:3000`.
2. The page loads with the `Classic Test Set` pre-selected by default.
3. Click `⚡ Run All Algorithms` to immediately restore all charts and results.

---

### Quick Hand-Calculation Shortcuts (Mental Math for the Viva)

Use these quick shortcuts if your teacher asks you to verify an algorithm by hand on paper:

- **FCFS Shortcut:**
  1. Sort processes by Arrival Time.
  2. Completion time of first job is `CT(1) = AT(1) + BT(1)`.
  3. For subsequent jobs: `CT(i) = max(AT(i), CT(i-1)) + BT(i)`.
  4. Compute `TAT = CT - AT` and average them.

- **SJF Shortcut (Non-Preemptive):**
  1. At each completion time, inspect all processes where `AT <= current_time`.
  2. Pick the one with the smallest `BT`.
  3. Once picked, add its full `BT` to get its `CT`.

- **SRTF Shortcut (Preemptive):**
  1. Only look at clock times where a **new process arrives**.
  2. At that arrival time, compare the new process's `BT` with the running process's `remaining burst`.
  3. If new `BT < remaining`, preempt. Otherwise, continue.
  4. Once all processes have arrived, SRTF behaves identically to non-preemptive SJF on remaining bursts.

- **Round Robin Shortcut:**
  1. Write down a horizontal queue on paper.
  2. Cross out at most `q` units from the head process's burst time.
  3. If a new process arrives at that exact boundary, write the new arrival in the queue first, then write the remaining process.
  4. Note the clock time when each process's burst reaches 0 as its `CT`.

- **Key Verification Invariant:**
  - `Sum of all TAT = Sum of all WT + Sum of all BT`
  - `Average TAT = Average WT + (Sum of BT / N)`
  - Use this formula to check your math in 5 seconds. If `Avg TAT - Avg WT` does not equal `Sum of BT / N`, there is an arithmetic error.

---

## 11. LAST-MINUTE CHECKLIST

### What to Have Open on Your Laptop Before the Teacher Arrives:
- [ ] Browser window open to `http://localhost:3000` (or `index.html` file path) with the simulator loaded.
- [ ] Terminal window open to the project directory, ready to run `node tests/engine.test.js`.
- [ ] This document (`PRESENTATION_GUIDE.md`) open in a split window or on a tablet.
- [ ] Clean sheet of paper and a pen for quick whiteboard or paper dry runs.

---

### 5-Line Formula & Rule Cheat Sheet:

1. `TAT = CT - AT` (Turnaround Time = Completion Time minus Arrival Time)
2. `WT = TAT - BT` (Waiting Time = Turnaround Time minus Burst Time)
3. `RT = First CPU Time - AT` (Response Time = First CPU Allocation minus Arrival Time)
4. `Avg TAT = (Sum of TAT) / N = Avg WT + (Sum of BT) / N`
5. **Rules:** Preemption requires strictly better metric (no tie preemption). Simultaneous RR arrival: new arrivals join the ready queue before the expired process. Idle periods do not increment context switches.
