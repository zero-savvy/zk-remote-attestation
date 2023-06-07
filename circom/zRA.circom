include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "tornado-core/circuits/merkleTree.circom";

// Prove being a member of a valid Merkle tree
template Attest(levels) {
    signal input root;
    signal input devAddr;
    signal input response;
    signal input challenge;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal hashValue;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== devAddr;
    hasher.inputs[1] <== challenge;
    hasher.inputs[2] <== response;
    hashValue <== hasher.out;
    
    // No need to check leaf === hashValue
    // This constraint will be passed if-and-only-if the hashValue
    // actually belongs to the Merkle tree of the given root,
    // which is checked in MerkleTreeChecker component :)
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== hashValue;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
}

component main {public [root, devAddr, challenge]} = Attest(20);
