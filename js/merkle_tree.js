const { poseidon } = require('@big-whale-labs/poseidon');
const { tmpdir } = require('os');
const prompt = require('prompt-sync')();
const {sha256, nxtPo2} = require('./utils');
const {createChallenges, createDeviceKeys, createResponse} = require('./manufacturer');
const fs = require('fs');


// DEBUGGING ENV
if (process.env.ENV != 'debugging') {
    console.debug = function () {};
}

// Define the hash function
function treeHash(left, right) {
    return poseidon([left, right]);
}

function buildMerkleTree(values) {
    let treeJson = {};
    let tree = [];
    let levelNodes = [];
    let levelHeight = 0;
    let height = Math.log2(values.length);
    let hashedValue;

    treeJson[height] = [];
    for (let i = 0; i < values.length; i++) {
        console.debug(`child_leaf[${i}]: ${treeHash(values[i], '')}`);
        hashedValue = treeHash(values[i], '');
        tree.push(hashedValue);
        treeJson[height].push('0x' + hashedValue.toString(16));
    }

    for (let levelSize = values.length; levelSize > 1; levelSize = Math.floor((levelSize + 1) / 2)) {
        levelNodes = [];
        levelHeight++;
        for (let i = 0; i < levelSize; i += 2) {
            const left = tree[tree.length - levelSize + i];
            const right = i + 1 < levelSize ? tree[tree.length - levelSize + i + 1] : '';
            levelNodes.push(treeHash(left, right));
        }
        tree = tree.concat(levelNodes);
        treeJson[height - levelHeight] = [];
        for (let k = 0; k < levelNodes.length; k++) {
            treeJson[height - levelHeight].push('0x' + levelNodes[k].toString(16));
        }
        console.debug(`level ${levelHeight} nodes (size=${levelSize}): ${levelNodes}`);
    }
    return treeJson;
}

console.log(`indicate number of devices`);
const givenNumKeys = prompt(`* Note: will be rounded up to the nearest power of 2: `);
const numKeys = nxtPo2(parseInt(givenNumKeys));
console.log(`Entered number is ${givenNumKeys}. Rounded up to ${numKeys}!`);
console.log(`------------------------------------------------------------`);
console.log(`Now set the number of attestations.`);
console.log(`e.g. attesting a device at every 10 minutes for a 1 period year will result in total of 51,264 attestations`);
const givenNumAtts = prompt(`* Note: this number also will be rounded up to the nearest power of 2: `);
const numAtts = nxtPo2(parseInt(givenNumAtts));
console.log(`Entered number is ${givenNumAtts}. Rounded up to ${numAtts}!`);

let {childPrivateKeys, childPublicKeys} = createDeviceKeys(numKeys);
let challenges = createChallenges(numAtts);

// Build the Merkle tree
console.log(`-----------------------------------------------`);
console.log(`Generating the Merkle tree for each device, based on the pseudo-random challendge and devices' predictable responses . . .`);
let responses;
let tmpTree, tmpTreeJson;
let devMT = [];
for (let i = 0; i < numKeys; i++) {
    responses = [];
    for (let j = 0; j < numAtts; j++) {
        responses.push(createResponse(
            challenges[j],
            childPrivateKeys[i], 
            (j == 0) ? childPrivateKeys[i] : responses[j-1]
            ));
    }
    tmpTreeJson = buildMerkleTree(responses);
    devMT.push(tmpTreeJson);
    // Dump the MerkleTree of the device into a specific file.
    // This file will be stored in the device itself.
    const dumpingData = JSON.stringify(tmpTreeJson);
    fs.writeFile(`devMT_files/device_${i}_merkle_tree.json`, dumpingData, err => {
        if (err) {
          throw err
        }
      })
}

let devMTRoots = [];
for (let i = 0; i < numKeys; i++) {
    devMTRoots.push(devMT[i][0][0]);
}
console.log(`Done!`);
console.log(`-----------------------------------------------`);
console.log(`Generating Merkle three of the previously generated Merkle roots (called MT^2 in the paper) . . .`);
const merkleTree = buildMerkleTree(devMTRoots);

// Log the master public key, child public keys, and Merkle tree
// console.log(`Master public key: ${master.publicExtendedKey}`);
// console.log(`Master private key: ${master.privateExtendedKey}`);
console.log(`Merkle tree: ${merkleTree}`);
console.log(`pubKeyChild[0]: ${childPublicKeys[0]}`);
tmp = 0;
merklePath = [];
// for (let i = 0; i < Math.log2(numKeys); i++) {
//     merklePath.push('0x' + merkleTree[tmp].toString(16));
//     tmp += numKeys / (i+1);
// }
// console.log(`Merkle Path of child 0: ${merklePath}`);
