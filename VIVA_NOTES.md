# Operating Systems Coursework: Viva Voce & Theory Guide
## Problem Statement 55: Compare Average Turnaround Times Across CPU Scheduling Algorithms

---

## 1. Algorithmic Overview (One-Paragraph Summaries)

### First-Come, First-Served (FCFS)
FCFS is the simplest non-preemptive scheduling policy, allocating the CPU to processes strictly in the chronological order of their arrival into the ready queue (managed as a standard FIFO queue). Once a process acquires the CPU, it holds it until completion or voluntary yield, making the algorithm completely non-preemptive. While trivially easy to implement with zero scheduling overhead, FCFS suffers heavily from the **Convoy Effect**, where short, I/O-bound jobs become bottlenecked behind long, CPU-bound processes, leading to elevated average waiting and turnaround times.

### Shortest Job First (SJF - Non-Preemptive)
SJF is a non-preemptive scheduling algorithm that selects from the ready queue the process with the smallest initial CPU burst time. Ties in burst time are broken first by earlier arrival time, and then by natural PID order. Because execution is non-preemptive, once a job starts, it runs to completion even if a significantly shorter process arrives immediately afterward. Although it minimizes average waiting time among non-preemptive algorithms, it requires prior knowledge of burst lengths and can lead to **starvation** for lengthy processes under heavy incoming traffic of shorter jobs.

### Shortest Remaining Time First (SRTF - Preemptive SJF)
SRTF is the preemptive counterpart of SJF, evaluating the ready queue at every clock tick to ensure the CPU is always allocated to the process with the smallest remaining burst time. If a newly arrived process possesses a remaining burst strictly smaller than that of the currently running process, the running job is preempted and returned to the ready queue; however, if remaining bursts are equal, the running job retains the CPU to minimize unnecessary context switches. In scheduling theory, SRTF is mathematically optimal for minimizing average waiting time and average turnaround time for any given set of processes.

### Priority Scheduling (Non-Preemptive)
Non-preemptive Priority Scheduling assigns each process an integer priority value and selects the highest-priority arrived job whenever the CPU becomes available. In standard academic conventions, a lower integer often denotes a higher priority (e.g., priority 1 beats priority 2), though practical systems or user toggles may reverse this rule. Once dispatched, a process runs to completion without interruption regardless of subsequent arrivals. The algorithm's primary drawback is **indefinite blocking (starvation)** of low-priority processes, traditionally mitigated through **aging** (gradually increasing a waiting job's priority over time).

### Priority Scheduling (Preemptive)
Preemptive Priority Scheduling continuously monitors the priority of ready processes at each time unit. If a process arrives whose priority is **strictly higher** than that of the currently executing process, the CPU immediately preempts the running job, records a context switch, and dispatches the newly arrived process. If an arrived job has a priority equal to or lower than the running job, no preemption occurs. This policy ensures rapid responsiveness for mission-critical tasks but exacerbates starvation for low-priority tasks and incurs greater context-switching overhead.

### Round Robin (RR)
Round Robin is a preemptive scheduling algorithm tailored for time-sharing and multi-user operating systems. Processes are cycled through a FIFO ready queue and allocated the CPU for a fixed time interval known as a **Time Quantum ($q$)**. If a process completes within its quantum, it terminates and frees the CPU; if its burst exceeds $q$, an operating system timer interrupt preempts the job, moves it to the tail of the ready queue, and context-switches to the next ready process. When a quantum expires simultaneously with new process arrivals, the new arrivals are enqueued first, followed by the preempted job. Round Robin delivers excellent response time and fairness, though its turnaround time depends heavily on quantum selection.

---

## 2. Core Scheduling Formulas & Mathematical Relationships

| Metric | Symbol | Definitive Formula | Conceptual Meaning |
| :--- | :---: | :--- | :--- |
| **Arrival Time** | $AT$ | Given input | Time at which the process arrives in the ready queue. |
| **Burst Time** | $BT$ | Given input | Total CPU execution time required by the process. |
| **Priority** | $PR$ | Given input | Static priority rating assigned to the process. |
| **Completion Time** | $CT$ | $t_{\text{finish}}$ | Exact clock instant at which the process finishes its final burst unit. |
| **Turnaround Time** | $TAT$ | $\mathbf{CT - AT}$ | Total elapsed time from process submission to process completion. |
| **Waiting Time** | $WT$ | $\mathbf{TAT - BT}$ | Total time spent by the process sitting idle in the ready queue. |
| **Response Time** | $RT$ | $\mathbf{t_{\text{first\_cpu}} - AT}$ | Time elapsed from arrival until the process first executes on the CPU. |

### Derived Metrics & Invariants
1. **Average Turnaround Time ($\text{Avg } TAT$):**
   $$\text{Avg } TAT = \frac{\sum_{i=1}^{N} TAT_i}{N} = \frac{\sum_{i=1}^{N} (CT_i - AT_i)}{N}$$

2. **Average Waiting Time ($\text{Avg } WT$):**
   $$\text{Avg } WT = \frac{\sum_{i=1}^{N} WT_i}{N} = \frac{\sum_{i=1}^{N} (TAT_i - BT_i)}{N}$$

3. **Fundamental Relation between Turnaround and Waiting Times:**
   $$\sum_{i=1}^{N} TAT_i = \sum_{i=1}^{N} WT_i + \sum_{i=1}^{N} BT_i \implies \mathbf{\text{Avg } TAT = \text{Avg } WT + \frac{\sum BT}{N}}$$
   *Crucial Viva Insight:* Because $\frac{\sum BT}{N}$ is a constant for any fixed process set, **minimizing average turnaround time is mathematically identical to minimizing average waiting time**.

4. **Non-Preemptive Response Time Identity:**
   For all purely non-preemptive algorithms (FCFS, SJF, Priority Non-Preemptive):
   $$RT_i = WT_i \quad \forall i$$
   *(Since a process is never interrupted once started, its initial wait is its only wait.)*

5. **CPU Utilization & Throughput:**
   $$\text{CPU Utilization} = \left(\frac{\text{Total Busy Time}}{\text{Total Elapsed Time}}\right) \times 100\%$$
   $$\text{Throughput} = \frac{N}{\text{Total Elapsed Time}} \quad (\text{processes/unit time})$$

---

## 3. Why SRTF Gives the Lowest Average Turnaround Time in Theory

1. **Equivalence to Minimizing Sum of Completion Times:**
   $$\text{Avg } TAT = \frac{1}{N} \sum_{i=1}^{N} (CT_i - AT_i) = \frac{1}{N} \sum_{i=1}^{N} CT_i - \frac{1}{N} \sum_{i=1}^{N} AT_i$$
   Because the arrival times $AT_i$ are fixed inputs, minimizing $\text{Avg } TAT$ is strictly equivalent to minimizing $\sum CT_i$.

2. **The "Accumulated Delay" Argument:**
   At any clock tick $t$, suppose $k$ uncompleted processes remain in the system. Every 1 unit of time the CPU spends running a job delays the completion time of all $k$ jobs (the 1 executing process plus the $k-1$ waiting processes). To minimize the growth of $\sum CT$, the scheduler must reduce $k$ (the count of remaining jobs) as rapidly as possible. Running the process with the shortest remaining burst finishes that job sooner than any alternative choice, decrementing $k$ at the earliest possible instant.

3. **Exchange Argument (Smith's Rule):**
   Suppose a schedule schedules process $A$ before process $B$, where remaining burst $R_A > R_B$. If we interchange them so $B$ runs before $A$:
   - Job $B$ finishes $R_A$ units earlier, decreasing $CT_B$ by $R_A$.
   - Job $A$ finishes $R_B$ units later, increasing $CT_A$ by $R_B$.
   - The net change in $\sum CT$ is $R_B - R_A < 0$ (a strict reduction).
   - All other jobs are unaffected.
   Therefore, any inversion where a longer job runs ahead of a shorter job strictly worsens total completion time.

4. **Why Non-Preemptive SJF Cannot Guarantee Optimality:**
   Non-preemptive SJF cannot resolve an inversion if a long job has already started. For example, if $P_1$ ($BT=10$) arrives at $t=0$, SJF must dispatch $P_1$. When $P_2$ ($BT=1$) arrives at $t=1$, SJF cannot interrupt $P_1$, forcing $P_2$ to wait 9 units ($CT_2 = 11$). SRTF preempts $P_1$ at $t=1$, finishing $P_2$ at $t=2$ ($CT_2 = 2$) and achieving a strictly lower $\text{Avg } TAT$.

---

## 4. Why Round Robin Has Higher Average TAT but Superior Response Time

### The Turnaround Time Trade-off
In Round Robin, all active jobs advance concurrently in discrete slices. Rather than completing processes sequentially ($P_1$, then $P_2$, then $P_3$), Round Robin keeps all jobs active until the very end.
- **Example:** Consider 3 identical jobs $A, B, C$ arriving at $t=0$ with $BT=10$.
  - Under FCFS/SJF: $A$ finishes at 10, $B$ at 20, $C$ at 30.
    $$\text{Avg } TAT = \frac{10 + 20 + 30}{3} = \mathbf{20.00}$$
  - Under Round Robin ($q=1$): All jobs take turns. $A$ completes at 28, $B$ at 29, $C$ at 30.
    $$\text{Avg } TAT = \frac{28 + 29 + 30}{3} = \mathbf{29.00}$$
Because completion times are deferred to the tail end of the schedule, Round Robin regularly yields the **highest** Average Turnaround Time among all algorithms.

### The Response Time Advantage
In interactive systems (such as desktops, mobile OSs, or web servers), users do not wait for batch jobs to finish; they expect immediate visual or transactional feedback:
- Under FCFS, job $C$ in the above example waits 20 units before receiving its very first CPU tick ($RT_C = 20$).
- Under Round Robin ($q=1$), job $C$ receives the CPU at $t=2$ ($RT_C = 2$).
The maximum time any process waits before its initial CPU allocation in Round Robin is bounded by $(N - 1) \cdot q$, preventing starvation and guaranteeing interactive responsiveness.

---

## 5. Tie-Breaking and Context-Switch Conventions in This Simulator

### Tie-Breaking Hierarchy
1. **Natural Alphanumeric PID Ordering:**
   When all scheduling criteria are identical, ties are resolved using natural alphanumeric comparison:
   $$\text{'P1'} < \text{'P2'} < \text{'P3'} < \dots < \text{'P9'} < \text{'P10'}$$
   *(Avoids lexicographical pitfalls where `'P10'` incorrectly precedes `'P2'`.)*

2. **Algorithm Tie-Break Rules:**
   - **FCFS:** Earliest arrival ($AT$ ASC) $\to$ Natural PID ASC.
   - **SJF (Non-Preemptive):** Smallest burst ($BT$ ASC) $\to$ Earliest arrival ($AT$ ASC) $\to$ Natural PID ASC.
   - **SRTF (Preemptive):** Smallest remaining burst $\to$ Earliest arrival $\to$ Natural PID ASC.
   - **Priority (NP & P):** Highest priority $\to$ Earliest arrival $\to$ Natural PID ASC.

3. **Strict Non-Preemption on Tie:**
   In SRTF and Preemptive Priority, a newly arrived process preempts the executing process **only if its metric is strictly superior**:
   - In SRTF: $Rem_{\text{candidate}} < Rem_{\text{running}}$ (Strictly less remaining burst).
   - In Preemptive Priority: $PR_{\text{candidate}} \text{ is strictly higher than } PR_{\text{running}}$.
   If metrics are equal, **the running process retains the CPU**, eliminating frivolous thrashing.

4. **Round Robin Simultaneous Arrival Rule:**
   When a process's quantum expires at clock boundary $t$ at the exact instant a new process arrives into the system:
   - The **new arrival is enqueued first** at the tail of the ready queue.
   - The **preempted process is enqueued second** behind the new arrival.
   - If multiple processes arrive at the same instant, they are enqueued in natural PID order.

### Context-Switch Counting Rules
1. A context switch is recorded **only when the CPU transitions from one real process to a different real process**.
2. **Start and End Exclusions:** Dispatching the first process at $t=0$ and terminating the final process at completion do not count as context switches.
3. **Context Switch Neutrality across Idle Gaps:** CPU idle periods are not processes. If process $P_1$ finishes at $t=2$, the CPU is idle from $t=2$ to $t=5$, and $P_2$ begins at $t=5$, exactly **1 context switch** is counted (the handover from $P_1$ to $P_2$).
4. **Self-Preemption Invariance:** In Round Robin, if a process's quantum expires but the ready queue is empty, the process continues running. Adjacent identical slices are merged into a single continuous Gantt block and contribute **0 extra context switches**.

---

## 6. Hand-Worked Dry Run of the Classic Test Set (Problem Statement 55)

### Workload Parameters
| Process | Arrival Time ($AT$) | Burst Time ($BT$) | Priority ($PR$) |
| :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 |
| **P2** | 1 | 4 | 1 |
| **P3** | 2 | 9 | 4 |
| **P4** | 3 | 5 | 3 |

*Simulation Options:* Time Quantum $q = 3$, Lower Number = Higher Priority (`lowerIsHigher = true`).

---

### Algorithm 1: First-Come, First-Served (FCFS)
- **Execution Timeline:**
  - $t=0$: Only $P_1$ has arrived. $P_1$ executes non-preemptively from $t=0$ to $t=8$.
  - $t=8$: $P_1$ completes ($CT=8$). Ready queue has $P_2(AT=1), P_3(AT=2), P_4(AT=3)$. Earliest arrival is $P_2$. $P_2$ runs from $t=8$ to $t=12$.
  - $t=12$: $P_2$ completes ($CT=12$). Ready queue has $P_3, P_4$. Earliest arrival is $P_3$. $P_3$ runs from $t=12$ to $t=21$.
  - $t=21$: $P_3$ completes ($CT=21$). Only $P_4$ remains. $P_4$ runs from $t=21$ to $t=26$.
  - $t=26$: $P_4$ completes ($CT=26$).
- **Gantt Chart:** `| P1 (0-8) | P2 (8-12) | P3 (12-21) | P4 (21-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 21 | 19 | 10 | 10 |
| **P4** | 3 | 5 | 3 | 26 | 23 | 18 | 18 |
| **Total**| — | **26**| — | — | **61** | **35** | **35** |
| **Avg** | — | — | — | — | **15.25** | **8.75** | **8.75** |

- **Context Switches:** $P_1 \to P_2 \to P_3 \to P_4 \implies \mathbf{3}$ context switches.

---

### Algorithm 2: Shortest Job First (SJF - Non-Preemptive)
- **Execution Timeline:**
  - $t=0$: Only $P_1$ ready. $P_1$ runs to completion from $t=0$ to $t=8$.
  - $t=8$: $P_1$ completes ($CT=8$). Ready queue contains $P_2(BT=4), P_3(BT=9), P_4(BT=5)$. Smallest burst is $P_2$ ($BT=4$). $P_2$ runs from $t=8$ to $t=12$.
  - $t=12$: $P_2$ completes ($CT=12$). Ready queue contains $P_4(BT=5), P_3(BT=9)$. Smallest burst is $P_4$. $P_4$ runs from $t=12$ to $t=17$.
  - $t=17$: $P_4$ completes ($CT=17$). Only $P_3(BT=9)$ remains. $P_3$ runs from $t=17$ to $t=26$.
  - $t=26$: $P_3$ completes ($CT=26$).
- **Gantt Chart:** `| P1 (0-8) | P2 (8-12) | P4 (12-17) | P3 (17-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Total**| — | **26**| — | — | **57** | **31** | **31** |
| **Avg** | — | — | — | — | **14.25** | **7.75** | **7.75** |

- **Context Switches:** $P_1 \to P_2 \to P_4 \to P_3 \implies \mathbf{3}$ context switches.

---

### Algorithm 3: Shortest Remaining Time First (SRTF - Preemptive)
- **Execution Timeline:**
  - $t=0$: $P_1$ starts ($rem=8$). Runs from $t=0$ to $t=1$.
  - $t=1$: $P_2$ arrives ($BT=4$). Running $P_1$ has $rem=7$. Since $4 < 7$, **$P_1$ is preempted**. $P_2$ runs.
  - $t=2$: $P_3$ arrives ($BT=9$). Running $P_2$ has $rem=3 < 9$. $P_2$ continues.
  - $t=3$: $P_4$ arrives ($BT=5$). Running $P_2$ has $rem=2 < 5$. $P_2$ continues.
  - $t=5$: $P_2$ completes ($CT=5$). Remaining jobs: $P_4(rem=5), P_1(rem=7), P_3(rem=9)$. Smallest is $P_4$. $P_4$ runs from $t=5$ to $t=10$.
  - $t=10$: $P_4$ completes ($CT=10$). Remaining jobs: $P_1(rem=7), P_3(rem=9)$. Smallest is $P_1$. $P_1$ resumes from $t=10$ to $t=17$.
  - $t=17$: $P_1$ completes ($CT=17$). Only $P_3(rem=9)$ remains. $P_3$ runs from $t=17$ to $t=26$.
  - $t=26$: $P_3$ completes ($CT=26$).
- **Gantt Chart:** `| P1 (0-1) | P2 (1-5) | P4 (5-10) | P1 (10-17) | P3 (17-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 17 | 17 | 9 | 0 |
| **P2** | 1 | 4 | 1 | 5 | 4 | 0 | 0 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 10 | 7 | 2 | 2 |
| **Total**| — | **26**| — | — | **52** | **26** | **17** |
| **Avg** | — | — | — | — | **13.00** | **6.50** | **4.25** |

- **Context Switches:** $P_1 \to P_2 \to P_4 \to P_1 \to P_3 \implies \mathbf{4}$ context switches.
- **Problem Statement 55 Winner:** SRTF achieves the **lowest Average Turnaround Time (13.00)**.

---

### Algorithm 4: Priority Scheduling (Non-Preemptive)
- **Execution Timeline:**
  - $t=0$: Only $P_1$ ready ($PR=2$). Runs non-preemptively from $t=0$ to $t=8$.
  - $t=8$: $P_1$ completes ($CT=8$). Ready: $P_2(PR=1), P_4(PR=3), P_3(PR=4)$. Highest priority (lowest number) is $P_2$. $P_2$ runs from $t=8$ to $t=12$.
  - $t=12$: $P_2$ completes ($CT=12$). Ready: $P_4(PR=3), P_3(PR=4)$. Highest priority is $P_4$. $P_4$ runs from $t=12$ to $t=17$.
  - $t=17$: $P_4$ completes ($CT=17$). Only $P_3(PR=4)$ remains. $P_3$ runs from $t=17$ to $t=26$.
  - $t=26$: $P_3$ completes ($CT=26$).
- **Gantt Chart:** `| P1 (0-8) | P2 (8-12) | P4 (12-17) | P3 (17-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 8 | 8 | 0 | 0 |
| **P2** | 1 | 4 | 1 | 12 | 11 | 7 | 7 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Total**| — | **26**| — | — | **57** | **31** | **31** |
| **Avg** | — | — | — | — | **14.25** | **7.75** | **7.75** |

- **Context Switches:** $P_1 \to P_2 \to P_4 \to P_3 \implies \mathbf{3}$ context switches.

---

### Algorithm 5: Priority Scheduling (Preemptive)
- **Execution Timeline:**
  - $t=0$: $P_1(PR=2)$ starts. Runs from $t=0$ to $t=1$.
  - $t=1$: $P_2$ arrives with $PR=1$. Since $1 < 2$ (strictly higher priority), **$P_1$ is preempted**. $P_2$ runs.
  - $t=2$: $P_3(PR=4)$ arrives. $PR=1 < 4$, so $P_2$ continues.
  - $t=3$: $P_4(PR=3)$ arrives. $PR=1 < 3$, so $P_2$ continues.
  - $t=5$: $P_2$ completes ($CT=5$). Ready: $P_1(PR=2, rem=7), P_4(PR=3, rem=5), P_3(PR=4, rem=9)$. Highest priority is $P_1$. $P_1$ resumes from $t=5$ to $t=12$.
  - $t=12$: $P_1$ completes ($CT=12$). Ready: $P_4(PR=3), P_3(PR=4)$. Highest priority is $P_4$. $P_4$ runs from $t=12$ to $t=17$.
  - $t=17$: $P_4$ completes ($CT=17$). Only $P_3$ remains. $P_3$ runs from $t=17$ to $t=26$.
  - $t=26$: $P_3$ completes ($CT=26$).
- **Gantt Chart:** `| P1 (0-1) | P2 (1-5) | P1 (5-12) | P4 (12-17) | P3 (17-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 12 | 12 | 4 | 0 |
| **P2** | 1 | 4 | 1 | 5 | 4 | 0 | 0 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 15 |
| **P4** | 3 | 5 | 3 | 17 | 14 | 9 | 9 |
| **Total**| — | **26**| — | — | **54** | **28** | **24** |
| **Avg** | — | — | — | — | **13.50** | **7.00** | **6.00** |

- **Context Switches:** $P_1 \to P_2 \to P_1 \to P_4 \to P_3 \implies \mathbf{4}$ context switches.

---

### Algorithm 6: Round Robin ($q = 3$)
- **Execution Timeline & Ready Queue Evolution:**
  - $t=0$: $P_1$ arrives $\implies \text{Queue: } [P_1]$. $P_1$ dispatched.
  - During $[0, 3)$: $P_2$ arrives at $t=1$, $P_3$ arrives at $t=2$.
  - $t=3$: Quantum expires for $P_1$ ($rem=5$). Simultaneously, $P_4$ arrives at $t=3$.
    *Rule:* New arrival $P_4$ enqueued first, then preempted $P_1$.
    $\implies \text{Queue: } [P_2, P_3, P_4, P_1]$.
  - $t=3$ to $6$: $P_2$ runs for full slice $q=3$ ($rem=1$). Preempted.
    $\implies \text{Queue: } [P_3, P_4, P_1, P_2]$.
  - $t=6$ to $9$: $P_3$ runs for full slice $q=3$ ($rem=6$). Preempted.
    $\implies \text{Queue: } [P_4, P_1, P_2, P_3]$.
  - $t=9$ to $12$: $P_4$ runs for full slice $q=3$ ($rem=2$). Preempted.
    $\implies \text{Queue: } [P_1, P_2, P_3, P_4]$.
  - $t=12$ to $15$: $P_1$ runs for full slice $q=3$ ($rem=2$). Preempted.
    $\implies \text{Queue: } [P_2, P_3, P_4, P_1]$.
  - $t=15$ to $16$: $P_2$ runs for remaining 1 unit. **$P_2$ completes at $t=16$ ($CT=16$)**.
    $\implies \text{Queue: } [P_3, P_4, P_1]$.
  - $t=16$ to $19$: $P_3$ runs for full slice $q=3$ ($rem=3$). Preempted.
    $\implies \text{Queue: } [P_4, P_1, P_3]$.
  - $t=19$ to $21$: $P_4$ runs for remaining 2 units. **$P_4$ completes at $t=21$ ($CT=21$)**.
    $\implies \text{Queue: } [P_1, P_3]$.
  - $t=21$ to $23$: $P_1$ runs for remaining 2 units. **$P_1$ completes at $t=23$ ($CT=23$)**.
    $\implies \text{Queue: } [P_3]$.
  - $t=23$ to $26$: $P_3$ runs for remaining 3 units. **$P_3$ completes at $t=26$ ($CT=26$)**.
- **Gantt Chart (10 slices):**
  `| P1(0-3) | P2(3-6) | P3(6-9) | P4(9-12) | P1(12-15) | P2(15-16) | P3(16-19) | P4(19-21) | P1(21-23) | P3(23-26) |`
- **Process Metrics Table:**

| PID | AT | BT | PR | CT | TAT ($CT-AT$) | WT ($TAT-BT$) | RT ($t_{\text{first}}-AT$) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 8 | 2 | 23 | 23 | 15 | 0 |
| **P2** | 1 | 4 | 1 | 16 | 15 | 11 | 2 |
| **P3** | 2 | 9 | 4 | 26 | 24 | 15 | 4 |
| **P4** | 3 | 5 | 3 | 21 | 18 | 13 | 6 |
| **Total**| — | **26**| — | — | **80** | **54** | **12** |
| **Avg** | — | — | — | — | **20.00** | **13.50** | **3.00** |

- **Context Switches:** 9 process-to-process switches.
- **Response Time Observation:** Notice that Round Robin delivers the **best Average Response Time (3.00)**, despite having the **worst Average Turnaround Time (20.00)**.

---

### Classic Set Comparative Summary (Problem Statement 55 Leaderboard)

| Rank | Algorithm | Preemptive? | Avg TAT | Avg WT | Avg RT | Context Switches | Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **SRTF** | **Yes** | **13.00** | **6.50** | 4.25 | 4 | 🏆 **Winner** |
| **2** | **Priority (Preemptive)** | Yes | **13.50** | 7.00 | 6.00 | 4 | Runner-up |
| **3** | **SJF (Non-Preemptive)** | No | **14.25** | 7.75 | 7.75 | 3 | Tied 3rd |
| **3** | **Priority (Non-Preemptive)** | No | **14.25** | 7.75 | 7.75 | 3 | Tied 3rd |
| **5** | **FCFS** | No | **15.25** | 8.75 | 8.75 | 3 | 5th |
| **6** | **Round Robin ($q=3$)** | Yes | **20.00** | 13.50 | **3.00** | 9 | 6th (Best RT) |

---

## 7. Top 15 Likely Viva Voce Questions & High-Scoring Answers

### Q1: What is the core objective of Problem Statement 55?
**Answer:** The objective is to take a single workload of processes with defined arrival times, burst times, and priorities, execute all standard CPU scheduling algorithms on it, compare their resultant Average Turnaround Times ($\text{Avg } TAT$), and identify which algorithm delivers the optimal turnaround efficiency.

### Q2: What is the Convoy Effect, and which algorithm suffers from it?
**Answer:** The Convoy Effect occurs in FCFS when a long CPU-bound process acquires the CPU, forcing numerous short I/O-bound processes to sit idle in the ready queue. This severely degrades CPU and I/O device utilization and drastically inflates average waiting and turnaround times.

### Q3: Why is Shortest Remaining Time First (SRTF) optimal for average turnaround time?
**Answer:** Minimizing average turnaround time is mathematically equivalent to minimizing the sum of completion times ($\sum CT$). By always dedicating the CPU to the job with the least remaining work, SRTF completes jobs and removes them from the system at the fastest possible rate, minimizing the accumulated waiting delay suffered by all remaining active processes.

### Q4: If SRTF is mathematically optimal, why do modern general-purpose operating systems not use it?
**Answer:** SRTF requires exact knowledge of future CPU burst lengths, which cannot be known in advance in general-purpose systems. Additionally, burst time estimation (e.g., via exponential smoothing) introduces computational overhead, and continuous preemption incurs context-switch penalties while risking indefinite starvation for long jobs.

### Q5: How is process CPU burst time estimated in practice?
**Answer:** Practical systems estimate upcoming burst lengths using **exponential smoothing** (a weighted moving average of past bursts):
$$\tau_{n+1} = \alpha t_n + (1 - \alpha) \tau_n$$
where $t_n$ is the actual length of the $n$-th burst, $\tau_n$ is the historical estimate, and $\alpha \in [0, 1]$ controls the relative weight of recent history versus older history.

### Q6: What is Starvation, and how is it resolved in priority-based schedulers?
**Answer:** Starvation (indefinite blocking) occurs when low-priority or lengthy jobs never receive CPU time because a steady influx of higher-priority or shorter jobs keeps preempting them. It is resolved using **Aging**, a mechanism that gradually increments the priority of processes as they wait in the ready queue until they eventually become the highest-priority job.

### Q7: What happens to Round Robin if the time quantum is too large or too small?
**Answer:**
- **Too large ($q \to \infty$):** Round Robin degrades into simple FCFS, losing its interactive responsiveness.
- **Too small ($q \to 0$):** Known as "Processor Sharing," where processes appear to run concurrently at $1/N$ speed, but real hardware collapses due to excessive context-switch overhead consuming majority CPU cycles.
- **Rule of Thumb:** A time quantum should be chosen such that approximately 80% of CPU bursts are shorter than $q$.

### Q8: What is the difference between Preemptive and Non-Preemptive scheduling?
**Answer:** In non-preemptive scheduling, once a process gets the CPU, it keeps it until it either terminates or blocks for I/O. In preemptive scheduling, the operating system can forcibly interrupt an actively executing process (via hardware timer or interrupt) and reallocate the CPU to a higher-priority or shorter job.

### Q9: What is the difference between Turnaround Time and Response Time?
**Answer:** Turnaround Time is the total elapsed time from job submission to final completion ($TAT = CT - AT$). Response Time is the time elapsed from job submission to the very first moment the job begins executing on the CPU ($RT = t_{\text{first\_cpu}} - AT$). In interactive computing, response time is the primary UX metric.

### Q10: Why does $RT = WT$ always hold for non-preemptive algorithms?
**Answer:** In non-preemptive scheduling, once a process is allocated the CPU for the first time, it runs uninterrupted until it finishes. Because it never returns to the ready queue, its initial wait before first execution is its only wait. Hence, First CPU Time minus Arrival Time equals Total Waiting Time.

### Q11: What is a Context Switch, and what state must the OS save during one?
**Answer:** A context switch is the process of storing the state of an active process and restoring the state of another process so that execution can be resumed later. The OS kernel saves the program counter (PC), CPU registers, stack pointers, memory management page tables/registers, and process control block (PCB) metadata.

### Q12: How does your code handle the case where a process quantum expires at the exact same instant a new process arrives?
**Answer:** The code implements the textbook operating system convention: **the new arrival is enqueued into the ready queue first**, and the preempted process whose quantum expired is enqueued second behind it. If multiple jobs arrive simultaneously, they are ordered by natural PID.

### Q13: Does an idle CPU period count as a context switch in your implementation?
**Answer:** No. Context switches are counted strictly when the CPU transfers from one real user process to another distinct real process. Idle intervals represent CPU halt/sleep states, not process-to-process switching. A transition like $P_1 \to \text{IDLE} \to P_2$ counts as exactly 1 context switch.

### Q14: What is Multilevel Feedback Queue (MLFQ) scheduling?
**Answer:** MLFQ is a sophisticated scheduling architecture comprising multiple ready queues with differing priority levels and time quanta (e.g., top queue has small $q$, lower queues have larger $q$). Jobs start in the top queue; if a job uses its full quantum without yielding, it is demoted to a lower queue. This automatically separates interactive I/O-bound jobs from CPU-bound batch jobs without prior burst knowledge.

### Q15: What is Dispatch Latency?
**Answer:** Dispatch latency is the elapsed time required by the operating system dispatcher to stop one process, perform the context switch, update hardware registers, switch address spaces, and jump to the proper instruction in the newly selected process to resume execution.
