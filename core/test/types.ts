import {parse,parseReference,interpret,expand,print,VERSION} from '@abstractlang/core';
import type {Document,Interpretation,ContextTerm} from '@abstractlang/core';
const document:Document=parse('a.b::c.d');
const analysis:Interpretation=interpret(document);
const term:ContextTerm|null=analysis.resolveReference('a:c.d');
const text:string|null=expand(document).text;
const source:string=print(document);
const version:'1.0.0'=VERSION;
const reference=parseReference('a:c.d').reference;
// @ts-expect-error Legacy document-wide aliases are not options in the current API.
interpret(source,{root:'warn'});
// @ts-expect-error Syntax choices are explicit.
parse(source,{syntax:'legacy'});
void [term,text,source,version,reference];

const updated=interpret('a.b::c.d\n(a:c.d)!.');
void [updated.detachments,updated.distinctions];

import {createLanguageService} from '@abstractlang/service';
import {startLanguageServer} from '@abstractlang/lsp';
import {runCLI} from '@abstractlang/cli';
const service=createLanguageService(new Map([['memory:/main.abstract',source]]));
void [service.graphFor('memory:/main.abstract'),startLanguageServer,runCLI];
