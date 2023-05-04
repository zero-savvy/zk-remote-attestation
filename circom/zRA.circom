include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "tornado-core/circuits/merkleTree.circom";

// computes Pedersen(nullifier + secret)
// template CommitmentHasher() {
//     signal input nullifier;
//     signal input secret;
//     signal output commitment;
//     signal output nullifierHash;

//     component commitmentHasher = Pedersen(496);
//     component nullifierHasher = Pedersen(248);
//     component nullifierBits = Num2Bits(248);
//     component secretBits = Num2Bits(248);
//     nullifierBits.in <== nullifier;
//     secretBits.in <== secret;
//     for (var i = 0; i < 248; i++) {
//         nullifierHasher.in[i] <== nullifierBits.out[i];
//         commitmentHasher.in[i] <== nullifierBits.out[i];
//         commitmentHasher.in[i + 248] <== secretBits.out[i];
//     }

//     commitment <== commitmentHasher.out[0];
//     nullifierHash <== nullifierHasher.out[0];
// }

// Prove being a member of a valid Merkle tree
template Attest(levels) {
    signal input root;
    signal input pubKey;
    // signal private input nullifier;
    // signal private input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal pubKeyHash;

    // component hasher = CommitmentHasher();
    // hasher.nullifier <== nullifier;
    // hasher.secret <== secret;
    // hasher.nullifierHash === nullifierHash;
    component hasher = Poseidon(2);
    hasher.inputs[0] <== pubKey;
    hasher.inputs[1] <== 0;
    pubKeyHash <== hasher.out;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== pubKeyHash;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
}

component main {public [root, pubKey]} = Attest(2);
