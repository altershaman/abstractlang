# Abstract Language in the Landscape of Knowledge Representation: A Critical Comparative Analysis

---

## Abstract

This paper situates **Abstract Language** (abstractlang) within the intellectual genealogy of knowledge representation, analogical reasoning, formal ontology, and distributed collaborative systems. We argue that while each predecessor captures a necessary dimension of the problem, none achieves the conjunction abstractlang is designed around: the judgment as atomic expression unit, the asymmetric abstraction operator as the sole structural primitive, a self-referential fixed-point root, Person-attributed Bounded Belief corpora, and a conflict model grounded in epistemic plurality.

---

## 1. Distributional Semantics and the Analogy Benchmark

The distributional hypothesis (Harris, 1954; Firth, 1957) grounds meaning in co-occurrence patterns. Word2Vec (Mikolov et al., 2013) demonstrated that directed relational structure is geometrically encoded in embedding space — the classic `king − man + woman ≈ queen` result.

The four-term proportional analogy datasets used to evaluate Word2Vec are structurally related to abstractlang judgments. But the semantic difference is decisive: Word2Vec's relational correspondence is symmetric and approximate. abstractlang's abstraction operator `:` is asymmetric and denotes instantiation — `cat.fur : animal.covering` says the cat-to-fur relation is a concrete case of the animal-to-covering pattern, not merely that they are structurally similar.

| Dimension | Word2Vec | abstractlang |
|-----------|----------|-------------|
| Operator | Similarity / vector proximity | Abstraction `:` — instantiation |
| Direction | Symmetric | Asymmetric |
| Character | Implicit, approximate | Explicit, exact |
| Attribution | None | Person-attributed (BB) |
| Hierarchy | None | Full judgment DAG |

When two concrete relations share a common abstract parent in a BB — each being a concrete case of the same abstract relation — they are co-instances of the same pattern. This navigable structural fact is what Word2Vec can only approximate as vector proximity.

---

## 2. Structure Mapping Theory

Dedre Gentner's Structure Mapping Theory (1983) identifies analogy as structural correspondence between higher-order relational patterns. Two domains are analogous when they share relational structure, regardless of surface similarity.

Abstractlang's abstraction operator goes beyond what SMT describes. SMT identifies symmetric structural correspondence — A analogous to B implies B analogous to A. abstractlang's `:` is asymmetric — it encodes that one relation is a concrete instantiation of another, not merely that they share structure. SMT is a cognitive process model; abstractlang is a formal language for storing and distributing instantiation judgments as personal BB corpora.

The concept of co-instantiation — two relations both being concrete cases of the same abstract relation — corresponds to SMT's structural alignment and is a naturally derived navigable fact in any BB DAG.

---

## 3. Formal Concept Analysis

Formal Concept Analysis (Wille, 1982) derives concept lattices from binary object-attribute relations. The resulting bounded lattice has genuine structural parallels to an abstractlang BB.

Key differences:

| Dimension | FCA | abstractlang |
|-----------|-----|-------------|
| Atomic unit | Formal concept (derived) | Judgment (cognitive expression) |
| Relation as entity | Not first-class | First-class structural node |
| Structural operator | Set inclusion (derived) | Abstraction operator `:` (expressed) |
| Root | Formal artifact | Self-referential judgment `yin.yang : yin.yang` |
| Person | None — single authority | Each BB = one Person's personal corpus |
| Distribution | Not designed for it | Core via communicative acts |
| Conflict | None | Reflex / negate |

In FCA, directed relations are attributes of objects — not first-class entities. abstractlang makes the directed relation a structural handle that can itself appear as the concrete side of a higher judgment.

FCA has no concept of a Person, a personally held corpus, or epistemic disagreement. It produces a single authoritative lattice. abstractlang produces as many BBs as there are Persons, each personally held, each potentially divergent.

---

## 4. Semantic Web and OWL

The Semantic Web (Berners-Lee et al., 2001) and OWL provide the richest existing formal infrastructure for knowledge representation.

**On the abstraction operator.** OWL's `subClassOf` encodes set-theoretic inclusion. abstractlang's `:` encodes directed relational instantiation. These are semantically distinct: set inclusion is about membership, instantiation is about pattern realization.

**On relations as entities.** OWL property assertions are not first-class objects. Placing a directed relation in an abstraction hierarchy requires RDF reification. abstractlang makes this the central and only operation.

**On the Person.** OWL assumes central authority. abstractlang is organized around the individual Person's BB. Cognitive acts are Person-attributed. Communicative acts distribute BBs without requiring convergence.

**On conflict.** OWL treats contradictions as reasoning failures. abstractlang encodes disagreement as a first-class state — surfaced during join and resolved by the receiving Person.

---

## 5. Wikipedia

| Dimension | Wikipedia | abstractlang |
|-----------|-----------|-------------|
| Atom | Article | Judgment (`a.b : c.d`) |
| Structural relation | Category membership | Abstraction operator `:` |
| Hierarchy | Shallow, informal | Bounded judgment DAG |
| Person | Suppressed (NPOV) | First-class (BB is personal) |
| Conflict | Editorial consensus | Receiver resolves during join |
| Distribution | Centralized | Communicative acts (share, join, contest) |

Wikipedia's category membership does not encode instantiation. Wikipedia suppresses the individual Person entirely. abstractlang makes the Person — their personal BB, their cognitive acts — the primary unit of organization.

---

## 6. Git

| Git | abstractlang |
|-----|-------------|
| Clone | share (full BB copy) |
| Fork | personal BB divergence |
| Merge | join (integrate another BB) |
| Merge conflict | conflicting reflex + negate |
| Merger decides | receiver resolves during join |
| Commit attribution | judgment author attribution |

The key difference: git merges text — a conflict is answerable by inspection. abstractlang merges judgment corpora — a conflict is a question about whether one relation instantiates another, answerable only by the receiving Person's cognitive judgment.

---

## 7. CRDTs and cr-sqlite

abstractlang's judgment set with ±1 signs is a modified 2P-Set CRDT:

```
add_set    = { judgments with sign +1 }   (reflex)
remove_set = { judgments with sign −1 }   (negate)
effective  = add_set \ remove_set
conflict   = add_set ∩ remove_set         → surfaced during join
```

The modification — surfacing rather than collapsing conflicts — is deliberate. Whether one directed relation instantiates another is a judgment that belongs to the Person, not to an automated policy.

---

## 8. Spencer-Brown's Laws of Form

Spencer-Brown's *Laws of Form* (1969) derives logic from the distinction — the primordial act of drawing a boundary. The re-entry form, where a distinction refers back to itself, generates self-consistency.

abstractlang's root `yin.yang : yin.yang` is a concrete instantiation of this re-entry: the abstraction operator applied to a relation that refers to itself. The judgment lattice folds back on itself at this fixed point — the same judgment form instantiating itself. This is the structural self-similarity the name abstractlang points toward.

---

## 9. Domain-Driven Design

### Background

Domain-Driven Design (Evans, 2003) organizes software around the domain model. Its central pattern — the **Bounded Context** — defines an explicit boundary within which a particular domain model is internally consistent and a team-agreed **Ubiquitous Language** holds. Different Bounded Contexts may use the same term with different meanings. **Context Maps** describe the relationships between contexts: shared kernel, anti-corruption layer, customer-supplier, and others. DDD rejects a single global domain model in favor of multiple locally coherent ones.

### Relation to abstractlang

The philosophical core is closely aligned. DDD's insight — "the same word means different things in different contexts, stop fighting it" — is structurally identical to abstractlang's: each Person holds their own semantics, no shared universal interpretation.

**Bounded Context ≈ shared BB.** A Bounded Context is a group of Persons whose BBs have converged through consensus into an agreed shared BB. Ubiquitous Language is the stable judgment set within that shared BB — the concepts and relations all Persons in the boundary have collectively reflected and not negated.

**Consensus is agreement, not technique.** DDD leaves the process by which a team reaches Ubiquitous Language outside its formal scope — it is a social and organizational practice. abstractlang leaves inter-personal consensus outside its formal scope too — it is tool-dependent, built on communicative acts. Both systems acknowledge the mechanism without formalizing it.

**BB is strictly more general.** DDD addresses only the collective case: a team or subdomain. It has no concept of an individual's bounded semantics. BB covers both: individual Person as the base unit, consensus group as the emergent collective case.

| Dimension | DDD | abstractlang |
|-----------|-----|-------------|
| Boundary unit | Team / subdomain / software module | Individual Person (or consensus group) |
| Internal structure | Informal — no prescribed formalism | Formal: BB as judgment DAG |
| Bounding criteria | Organizational / business / technical | Epistemic: personality, interest, cognition, global root |
| Shared language | Ubiquitous Language — team-agreed terms | Shared BB — post-consensus judgment set |
| Consensus mechanism | Informal social practice (outside DDD) | Communicative acts — tool-dependent (outside abstractlang) |
| Cross-boundary interaction | Context Maps (ACL, Shared Kernel, etc.) | share, join, contest |
| Global semantics | Rejected | Rejected |

The remaining gap is formalism and granularity: DDD names organizational forces that bound a context; abstractlang names epistemic forces (personality, interest, cognition, global root). DDD describes how teams should carve up a system; abstractlang describes how Persons constitute and share knowledge — and what happens when they disagree.

---

## 10. Conclusion

| System | Judgment atom | Abstraction `:` | Self-ref root | Person BB | P2P communicative acts |
|--------|--------------|----------------|--------------|-----------|------------------------|
| Word2Vec | No | No | No | No | No |
| Structure Mapping | Implicit | Correspondence only | No | No | No |
| FCA | Derived | Set inclusion | Trivial | No | No |
| OWL | No | subClassOf | No | No | Partial |
| Wikipedia | No | Membership | No | Suppressed | No |
| Git | No | No | No | Yes (repo) | Yes |
| CRDTs | Arbitrary | No | No | Partial | Yes |
| DDD | No | No | No | Partial (BC) | Partial (Context Maps) |
| **abstractlang** | **Yes** | **Yes (`:`)** | **Yes** | **Yes (BB)** | **Yes** |

No prior system achieves all five simultaneously. abstractlang is the attempt to occupy that intersection. DDD comes closest on the organizational axis — its Bounded Context is the collective analog of BB — but operates without formal structure, epistemic bounding criteria, or individual-level semantics.
