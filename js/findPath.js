const fs = require('fs');

function createMerklePath(leafIndex, treeDepth) {
    merklePath = [];
    let nodeIndex = leafIndex;
    for (let level = 0; level < treeDepth; level++) {
        const siblingIndex = nodeIndex % 2 === 0 ? nodeIndex + 1 : nodeIndex - 1;
        merklePath.push(siblingIndex);
        nodeIndex = Math.floor(nodeIndex / 2);
    }
    
    return merklePath;
  }
leafIndex = 222270

let merklePaths = [];
let merkleIndices = [];

fs.readFile(`devMT_files/device_0_merkle_tree.json`, 'utf8', (err, data) => {
    if (err) {
        throw err;
    }
    treeJson = JSON.parse(data);
    pathIndices = createMerklePath(leafIndex, 20);
    for (let level = 0; level < 20; level++) {
        merkleIndices.push(pathIndices[level] % 2 === 0 ? 1 : 0);
        merklePaths.push(treeJson[(20-level)][pathIndices[level]]);
    }
    console.log(merklePaths);
    console.log(merkleIndices);
});