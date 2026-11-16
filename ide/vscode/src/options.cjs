'use strict';
exports.createClientOptions=function(watcher){
  return {documentSelector:[{scheme:'file',language:'abstract'},{scheme:'untitled',language:'abstract'}],synchronize:{fileEvents:watcher},diagnosticCollectionName:'abstract'};
};
