import json
from typing import List
from posi import pos_instance

hash_func = pos_instance()
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617


class MerkleTreeNode:
    left: int
    right: int
    value: int
    
    def __init__(self, left, right):
        self.left = left
        self.right = right
        self.value = hash_func.run_hash([self.left, self.right])

class MerkeTree:
    height: int
    leaves: List[int]
    root: MerkleTreeNode
    inner_nodes: List[List[MerkleTreeNode]]
    
    def __init__(self, height):
        self.height = height
        self.leaves = [0] * (2 ** height)

    def build_tree(self):
        if len(self.leaves) != 2 ** self.height:
            raise Exception(f"incorrect number of leaves, must be {2 ** (self.height - 1)}, but was {len(self.leaves)}")
        
        # initialize inner nodes
        self.inner_nodes = []
        for i in range (self.height - 1):
            self.inner_nodes.append([])

        # claculate values of the inner nodes of height=1 
        for j in range(0, len(self.leaves), 2):
            self.inner_nodes[0].append(MerkleTreeNode(self.leaves[j], self.leaves[j+1]))
                
        # calculate inner nodes values
        for i in range(1, len(self.inner_nodes)):
            for j in range(0, len(self.inner_nodes[i-1]), 2):
                self.inner_nodes[i].append(MerkleTreeNode(self.inner_nodes[i-1][j].value, self.inner_nodes[i-1][j+1].value))
        
        # calculate root of the MerkleTree
        self.root = MerkleTreeNode(self.inner_nodes[-1][0].value, self.inner_nodes[-1][1].value)


if __name__ == "__main__":
    """
    HASH(3,4) in Circom = 14763215145315200506921711489642608356394854266165572616578112107564877678998
    """
    print(hash_func.run_hash([1,2]))
    sample_pk = 3
    mrkl = MerkeTree(2)
    mrkl.leaves[0] = 1
    mrkl.leaves[1] = 2
    mrkl.leaves[2] = sample_pk
    mrkl.leaves[3] = 4
    print(mrkl.leaves)
    mrkl.build_tree()
    print('Merkle root:', mrkl.root.value)
    print('Merkle node:', mrkl.inner_nodes[0][0].value, mrkl.inner_nodes[0][1].value)
    print('Merkle root:', mrkl.root.value)

    INPUT_PATH = "circom/inputs/good_input.json"
    inputs = {
        "root": int(mrkl.root.value) % p,
        "pubKey": int(sample_pk) % p,
        "pathElements": [
            int(mrkl.leaves[3]) % p,
            int(mrkl.inner_nodes[0][0].value) % p
        ],
        "pathIndices": [
            "0",
            "1"
        ]
    }
    json.dump(inputs, open(INPUT_PATH, "w"), indent=4)

        

