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

---

## Running the Suite

For each question, capture two answers from the same deployed Level-1 chatbot: one with the graph layer disabled (1a) and one with it enabled (1b). Present them side by side. The contrast is the point; the absolute quality of either answer is secondary.

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
