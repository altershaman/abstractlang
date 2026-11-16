import type {Document,Range,Interpretation} from '@abstractlang/core';
export interface SemanticToken {range:Range;type:'term'|'dot'|'doubleColon'|'bang'|'colon'|'comment';modifiers:('concretization'|'abstraction'|'reference'|'rootAbstraction')[]}
export const semanticTokenLegend:{readonly tokenTypes:readonly string[];readonly tokenModifiers:readonly string[]};
export function semanticTokens(document:Document,options?:{graph?:Interpretation}):SemanticToken[];
