const { poseidon } = require('@big-whale-labs/poseidon');
const bip39 = require('bip39');
const HDKey = require('hdkey');

// DEBUGGING ENV
if (process.env.ENV != 'debugging') {
    console.debug = function () {};
}

// Define the hash function
function hash(left, right) {
    return poseidon([left, right]);
}

function buildMerkleTree(values, hash) {
    let tree = [];
    let level_nodes = [];
    let level_height = 0;
    for (let i = 0; i < values.length; i++) {
        console.debug(`child_leaf[${i}]: ${hash(values[i], '')}`);
        tree.push(hash(values[i], ''));
    }
    for (let levelSize = values.length; levelSize > 1; levelSize = Math.floor((levelSize + 1) / 2)) {
        level_nodes = [];
        level_height++;
        for (let i = 0; i < levelSize; i += 2) {
            const left = tree[tree.length - levelSize + i];
            const right = i + 1 < levelSize ? tree[tree.length - levelSize + i + 1] : '';
            level_nodes.push(hash(left, right));
        }
        tree = tree.concat(level_nodes);
        console.debug(`level ${level_height} nodes (size=${levelSize}): ${level_nodes}`);
    }
    return tree;
}
let mnemonic = bip39.generateMnemonic();
let seed = bip39.mnemonicToSeedSync(mnemonic);

const numKeys = 4;
const childPublicKeys = [];

const master = HDKey.fromMasterSeed(seed);
console.log(master.privateExtendedKey);
console.log(master.publicExtendedKey);
for (let i = 0; i < numKeys; i++) {
    const child = master.deriveChild(i);
    console.debug(child.publicKey);
    console.debug(parseInt(child.publicKey.toString('hex'), 16));
    console.debug("--------");
    childPublicKeys.push('0x' + child.publicKey.toString('hex'));
}

// Build the Merkle tree
const merkleTree = buildMerkleTree(childPublicKeys, hash);

// Log the master public key, child public keys, and Merkle tree
console.log(`Master public key: ${master.publicExtendedKey}`);
console.log(`Master private key: ${master.privateExtendedKey}`);
console.log(`Merkle tree: ${merkleTree}`);