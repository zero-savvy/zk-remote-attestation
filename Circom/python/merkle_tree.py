from typing import List
from posi import pos_instance

hash_func = pos_instance()


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
    mrkl = MerkeTree(2)
    mrkl.leaves[0] = 0x2222
    mrkl.leaves[1] = 0x1111
    mrkl.leaves[2] = 0x3333
    mrkl.leaves[3] = 0x8989
    print(mrkl.leaves)
    mrkl.build_tree()
    print('Merkle root:', mrkl.root.value)
            
    

        

