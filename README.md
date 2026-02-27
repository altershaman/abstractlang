# abstractlang repo
Abstractlang description

## Purpose of language
To describe architecture of worlds 

## Core syntax
### Coments
There are line comments only. Whenever `//` (double slash) is occured the rest of line is commented

### Knowledge Capsule
![](ablang.svg)

`:` is a special mark indicating the declaration-abstraction relationship between two **relations**
`.` is a special mark indicating any arbitrary relationship between two **entities**

#### Binary logic
All KCs are `true` statements, except those which are marked with `!` prefix.
written: !A.B:D.E // Statement of `false`
read: A relates to B NOT as D relates to E
means: negative statement kept in KB

## Entities
There is nothing special about entity definitions. Entities are defined by what they relate to. If we start with no knowledge of any entity, we assign a name to somethig observable or imaginable and trying derive its meaning from relations and abstractions and crafting them if possible.

TBD: How to distinguish two different entitites with the same name?
## Queries
Special symbols are `?` `::` `@`

## Knowledge Base
KB is a simple list of KCs