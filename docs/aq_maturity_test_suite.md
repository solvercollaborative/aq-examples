# AQ Maturity Test Suite

## Purpose

A teaching/demo asset for the AQ Maven course series. For each maturity-level boundary (1a -> 1b, 2 -> 3, ...), this suite lists a small number of questions that produce **unsatisfactory** answers at the lower level and **satisfactory** answers once the next-level capability is in place.

The questions are framed as something a real visitor to a sailing-school website would type into a public chatbot. The contrast is intended to be visible in a live demo, not just on paper.

---

## Level 1a (RAG) -> Level 1b (GraphRAG)

**Capability under demonstration**

- 1a: Embedding-based retrieval over public website chunks; LLM synthesizes from top-k passages.
- 1b: Same retrieval plus a typed knowledge graph over courses, certifications, prerequisites, boats, programs, and the relationships between them. The synthesizer can traverse the graph and ground claims in structured facts.

**Why these three questions**

Each one targets a distinct structural capability that an embedding index alone does not provide:

| # | Capability gap exposed | Graph operation that closes it |
|---|------------------------|-------------------------------|
| 1 | Multi-hop chains across documents | Directed traversal of `REQUIRES_COURSE` / `PREREQUISITE_OF` edges |
| 2 | Inverse / reverse enumeration | Reverse traversal of a typed edge (`USES_BOAT`) |
| 3 | Disambiguation of overloaded vocabulary | Distinct typed nodes with program scope |

---

### Question 1: Multi-hop prerequisite chain

> "What's the full path of courses I need to take to become an instructor someday?"

**1a (RAG-only) outcome: unsatisfactory**

The retriever finds the Instructor Certification page and a couple of course pages whose chunks score well for "instructor" and "path." The synthesizer produces a plausible-sounding list, but:

- It usually skips one or two intermediate courses, such as naming the certification and the entry-level course but losing the cruising step in between.
- Ordering is unreliable because the model has no signal that course A must be completed before course B beyond what any single chunk happens to say.
- If two pages disagree on the ordering or use different course names for the same step, the answer silently picks one.

The user gets a confident-sounding partial path. They cannot tell what is missing.

**1b (GraphRAG) outcome: satisfactory**

`InstructorCert` node is the target. Traverse `REQUIRES_COURSE` backward, then for each course traverse `PREREQUISITE_OF` until the chain bottoms out at the entry-level course. Return the complete ordered chain with the cert as the terminal node. The answer is grounded in structured edges, not in whatever happened to be in the top-k chunks.

**Captured runs**

Paste real answers here as they are captured so the demo (and the article) can quote them verbatim. Use one block per run; keep older runs for diff/history.

- 1a (RAG-only)
  - Captured: 2026-04-26T17:33:26+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `rag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > To become a Sail Chicago instructor, you need to follow this path of courses:
    >
    > 1. **Crew Course** - Start by learning the basics of sailing.
    > 2. **First Mate Course** - Build on your skills and knowledge.
    > 3. **Skipper Prep Course** - Prepare for the Skipper qualification.
    > 4. **On-the-Water (OTW) Skill Standards Assessment** - Pass this assessment during or after your Skipper Prep course.
    > 5. **Instructor Prep Class** - After gaining at least two years of experience as a skipper at Sail Chicago, you can enroll in this class to prepare for teaching.
    >
    > Additionally, you will need to pass the US Sailing Basic Keelboat Exam and the Sail Chicago Rules & Policies Exam, sign the New Skipper Attestation, and complete three private sails as the skipper of record with another Sail Chicago skipper aboard.
  - Evaluator note: Gives a plausible path, but mixes course names and requirements without showing the complete structured prerequisite chain.

- 1b (GraphRAG)
  - Captured: 2026-04-26T17:33:33+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `graphrag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > To become a Sail Chicago instructor, you need to follow this path of courses and stages:
    >
    > 1. **Interested in Teaching**: Start by being an experienced sailor interested in teaching. You must hold relevant sailing certifications.
    >
    > 2. **Prerequisites Met**: Ensure you have the required sailing certifications for the instructor level you are targeting (Basic Keelboat Instructor, Cruising Instructor, or other).
    >
    > 3. **Instructor Training**:
    >    - Complete the **Instructor Prep class**, which prepares you to teach classes at Sail Chicago.
    >    - You need a minimum of two years of experience as a skipper at Sail Chicago and to be a confident sailor.
    >    - The training includes shadowing an instructor and attending on-the-water classes.
    >
    > 4. **Certified Instructor**: After completing the training and meeting all requirements, you will achieve certification as an instructor.
    >
    > This journey is designed to ensure that you are well-prepared to teach sailing effectively and safely.
  - Evaluator note: Uses the instructor-certification journey graph, but this captured answer is more journey-stage oriented than course-chain oriented; keep it as evidence and refine the graph prompt if the demo needs a stricter ordered-course chain.

---

### Question 2: Inverse enumeration

> "Which classes are taught on the Colgate 26?"

**1a (RAG-only) outcome: unsatisfactory**

"Colgate 26" appears on the boat description page and is mentioned in passing on several course pages. The retriever returns the boat page, because it has high similarity, and one or two course pages where the boat is named in a prominent paragraph. The synthesizer answers with that subset.

- Courses that mention "Colgate" only in a sidebar, table, or fleet list are missed because their chunks score lower.
- The model cannot tell the difference between "this page mentions the boat" and "this course is taught on the boat."
- Add a new course that uses the Colgate 26 next month and the answer silently goes stale until the chunk happens to be re-embedded with the right surrounding text.

The user gets an incomplete list and has no way to know it is incomplete.

**1b (GraphRAG) outcome: satisfactory**

`Boat:Colgate 26` is a single node. Reverse-traverse the `USES_BOAT` edge to enumerate every `Course` node that points at it. The answer is the complete set, deterministically. Adding a new course wires up the edge at ingestion time and the answer updates with no prompt change.

**Captured runs**

- 1a (RAG-only)
  - Captured: 2026-04-26T17:33:39+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `rag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > Classes taught on the Colgate 26 include:
    >
    > - Basic Keelboat - Skipper Prep
    > - Tiller Time sessions
    >
    > These classes focus on teaching sailors to skipper a keelboat and improve their sailing skills.
  - Evaluator note: Returns a subset and adds Tiller Time, but misses the complete Basic Keelboat course set associated with the Colgate 26.

- 1b (GraphRAG)
  - Captured: 2026-04-26T17:33:42+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `graphrag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > The Colgate 26 is used for several courses in the Basic Keelboat program at Sail Chicago. The specific classes taught on the Colgate 26 include:
    >
    > - Keelboat Crew (BK-CR)
    > - Keelboat First Mate (BK-FM)
    > - Keelboat Skipper Prep (BK-SP)
  - Evaluator note: Reverse traversal over the boat relationship returns the complete structured set of Basic Keelboat courses taught on the Colgate 26.

---

### Question 3: Overloaded-vocabulary disambiguation

> "What's the difference between 'FM' in the Basic Keelboat program and 'FM' in the Basic Cruising program?"

**1a (RAG-only) outcome: unsatisfactory**

"FM" is overloaded across the school's programs:

- In **Basic Keelboat (BK)**, FM is the **Final Module**, the capstone class of the entry-level dinghy/keelboat track.
- In **Basic Cruising (BC)**, FM is **First Mate**, the crew-oriented fundamentals course in the new BC-FM / BC-SP split.

The retriever pulls chunks containing "FM" from both programs without preserving which program each chunk belongs to. The synthesizer either:

- Conflates them, giving one definition that sounds reasonable but is wrong for one of the two contexts.
- Hedges with "FM can mean different things depending on context" without actually drawing the distinction the user asked for.

In a public demo this is the worst kind of failure: the answer is fluent and confidently wrong.

**1b (GraphRAG) outcome: satisfactory**

The graph holds `BK-FM` and `BC-FM` as distinct course nodes, each scoped to its parent program (`BK` vs. `BC`) with its own `audience`, `outcomes`, and `prerequisites`. The synthesizer is given both nodes, with their structural attributes side by side, and produces a clean comparison. Demonstrates that the graph enforces the disambiguation that prose alone cannot.

**Captured runs**

- 1a (RAG-only)
  - Captured: 2026-04-26T17:33:47+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `rag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > The 'FM' in the Basic Keelboat program refers to the "First Mate" course, which focuses on mastering boat handling skills and learning to skipper a keelboat under guidance. In contrast, the 'FM' in the Basic Cruising program is not explicitly defined in the provided sources, so its specific meaning or context isn't available.
    >
    > In summary:
    > - **Basic Keelboat Program**: 'FM' stands for "First Mate," emphasizing boat handling and skippers' skills.
    > - **Basic Cruising Program**: The meaning of 'FM' is not specified in the sources.
  - Evaluator note: Identifies one meaning but fails to recover the program-scoped meaning for Basic Cruising, demonstrating overloaded vocabulary and missing context.

- 1b (GraphRAG)
  - Captured: 2026-04-26T17:33:52+00:00
  - Source: `scripts/aq_maturity_runner.py`, tenant `sailchicago.org`, mode `graphrag`
  - Model: `gpt-4o-mini`; embedding `text-embedding-3-small`; top-k 8
  - Answer:
    > The 'FM' in the Basic Keelboat program refers to the Keelboat First Mate (BK-FM) course, which is taught on Colgate 26 boats. In contrast, the 'FM' in the Basic Cruising program stands for Cruising First Mate (BC-FM), which is taught on Cruiser 34 boats.
    >
    > Key differences include:
    > - **Keelboat First Mate (BK-FM)**: Focuses on basic keelboat skills and is conducted on smaller Colgate 26 boats.
    > - **Cruising First Mate (BC-FM)**: Emphasizes cruising-specific skills and is conducted on larger Cruiser 34 boats.
    >
    > Typically, completion of the Basic Keelboat course or equivalent experience is required before enrolling in the Cruising First Mate course.
  - Evaluator note: Distinguishes `BK-FM` and `BC-FM` as separate program-scoped course nodes and produces the comparison the user asked for.

---

## Running the Suite

For each question, capture two answers from the same deployed Level-1 chatbot: one with the graph layer disabled (1a) and one with it enabled (1b). Paste both into the **Captured runs** block under that question, including the date, source endpoint, and model so the comparison is reproducible. Present the captured pair side by side in the Maven lesson; the contrast is the point, and the absolute quality of either answer is secondary.

Audience takeaway: a website chatbot built on embeddings alone has a predictable failure shape: multi-hop chains, inverse enumeration, and overloaded vocabulary. The graph is the smallest capability that closes all three.

---

## Future Levels

This file should grow with one section per level boundary:

- Level 2 -> Level 3: questions that need a channel such as Slack or email to answer well, not a website chat.
- Level 3 -> Level 4: questions whose answer depends on knowing where the user is in a journey.
- Level 4 -> Level 5: questions whose answer depends on who the user is.
- Level 5 -> Level 6: questions whose answer depends on mining prior conversations to discover patterns, gaps, or blockers.
- Level 6 -> Level 7: questions whose answer depends on live data from systems of record.
- Level 7 -> Level 8: requests that require controlled create, update, or delete operations on tenant-enabled business objects.
- Level 8 -> Level 9: requests that require exposing governed AQ knowledge, tools, or actions to other AI agents.

Add the next section when the corresponding Maven lesson is being prepared.
