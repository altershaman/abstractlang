## Abstract language

Abstract language communicates relationships, and these relationships collectively constitute a knowledge graph.

### Knowledge Elements
The declarative aspect of abstract language concerns statements about relationships. The only declarative statement is called a "Knowledge Element" (KE), which is a super special kind of relation written with syntax as follows:

    'declaration : abstraction', where both declaration and abstraction are relations (white spaces ignored). **Abstraction** is the higher-level concept that the declaration exemplifies, while the declaration serves as an instance, class, revelation, occurrence, or manifestation of that abstraction.

    ':' is a special mark indicating the declaration-abstraction relationship between two **relations**.

Relations have the syntax: entity.entity, where '.' is a special mark for an arbitrary relation between two **entities** or identifiers. Thus, the full syntax of a KE is 'entity_a.entity_b:entity_c.entity_d', where the left part is the declaration and the right part is the abstraction. It shoud be read as 'entity_a relates to entity_b as entity_c relates to entity_d.

To state a new KE, you need to answer two questions: (1) whether the declaration truly is an abstraction (note: part-whole is composition, not abstraction), and (2) whether the abstraction manifests as the declaration. If both answers are true, then you can state new the KE.

### Entities
There is nothing special about entity definitions. Entities are defined by what they relate to. If we start with no knowledge of any entity, we assign a name to somethig observable or imaginable and trying derive its meaning from relations and abstractions and crafting them if possible.

????????????
If two identical KE occur than all corresponding entities are the same.
?????????
If entity name occurs in defferent KE than these entities could be different or the same. 

### Syntax Sugar
#### Aliases
You can assign alias to any relation with sintax: entity.entity=alias and then use alias in KEs: alias:entity.entity or entity.entity:alias or alias:alias

// Direction does matter. KE could be read from left to rigth or right to left. Aliases could be left to right >alias, right to left <alias or direction agnostic =alias. Relation could be aliased these three ways simultaniously.

