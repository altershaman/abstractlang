# Abstract Language

> [!TIP]
> Formal language for expressing knowledge about worlds. 
>
> [Why 'yet another knowledge system'?](/abstractlang_comparative.md)

---
In Abstract Language (abstractlang) the only precise irreducible knowledge unit which cannot be decomposed further without losing the knowledge is **judgment**.

**Person** performs cognitive acts and produces judgments:
* reflects observable into judgments or retracts one;
* agrees or negates on judgments communicated from other Persons;
* and sometimes even negates or reclames on his or her own judgments produced earlier.

All Person's judgments constitute **Bounded Knowledge (BK)**:
* bounded by personality;
* bounded by application or interest;
* bounded by cognition capability;
* bounded by global root (see yin.yang section).

In short, each Person holds their own semantics — no shared universal interpretation.

Abstractlang proposes formalism: syntax, semantics and acts for this ancientest process.

## Core syntax and semantics
![](/abstractlang_BK.svg)
### Judgment
Judgment expression looks like `C.D:A.B`:
- **A**, **B**, **C**, **D** are concepts;
- **.**	relating operator, binds two concepts into a directed relation;
- **:**	abstracting operator, left relation is concretization, instance, exemplar, manifest or **declaration** of right more abstract relation which is **abstraction** above, class or type of, generalization of left.

> [!IMPORTANT]
> It's fully Person's liability to honor abstraction rule. Abstractlang itself has no mechanics to check if judgment really abstraction and not composition, similarity, analogy, etc. But such tooling may be built outside abstractlang itself.

#### Canonical and mirroring forms
Judgments are directed by design, but there are two options to put them down. C.D:A.B is naturaly the same as D.C:B.A. For uniformity purpose it's good practice to choose one 'canonical' form of two and use it consistently. But it's optional for tools developers.

#### Contradictions
Judgments are immutable by nature. If Person changes judgment he or she produces new judgment. And if semantic contradiction rised between two judgments after new judgment reflected into BK, Person inclines to **negate** false one or even **retract** it (hard remove from BK without traces).

> [!NOTE]
> Negation may occur without new reflection, i.e. Person found their previously reflected judgment is false for now.
> Negation reversable -- could be reclamed if found true for now.

#### Relations
Relations are structural constituents of judgments — derived from the judgment set, never created directly and possess no knowledge. So there is no 'hanged' relations in BK. They are immutable as judgments are. If person 'edit' relation, he or she produces a new judgment with 'edited' declaration or abstraction.

#### Concepts
Concepts are titled arbitrary pieces of data, not knowledge yet. They couldn't be created alone as relations are. Concepts are subproducts of reflecting judgments. But unlike relations and judgments they are mutable. 
> [!IMPORTANT]
> It's fully Person's liability to decide where is cutting edge of changes behind which it is another concept already.

### Bounded Knowledge
Any BK is simply list of Person's judgments from storage structure point of view and is DAG (Directed Acyclic Graph) from semantic point:
- relations could take positions in concrete (left) or in abstract (right) of judgments forming graph;
- BK is expected to be connected: every judgment should have a path to the root. Isolated judgments are not invalid, but carry no navigable meaning.
- BK should stay acyclic because 'abstraction' has one way semantic meaning. Cycles or loops corrupt knowledge with one exception -- 'root';
- structurally any BK bounded from top by single universal 'root' judgment: yin.yang:yin.yang

> #### The Root: `yin.yang:yin.yang`
> Every BK is pre-seeded with (or must have) one judgment:
> ```
> yin.yang:yin.yang
> ```
> The only judgment where both sides are the same. It reads:
> *"yin to yang relation is a concrete case of yin to yang relation"*
> Self-referential — the primal polarity is its own abstraction. Every judgment chain must eventually reach this point. The structure closes on itself here — which is the fractal structure the project name describes.

## Interacting BK (tool dependent)
There are three interacting families in abstractlang:
1. Cognitive: reflex, retract, negate, reclame, edit (concepts) -- see previous section;
2. Investigative: queries, projections, filters, traverse, renders (TBD)
3. Communicative: dispense, acquire (TBD)
