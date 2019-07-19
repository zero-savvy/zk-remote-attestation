pragma solidity ^0.5.8;

import "./MerkleTreeWithHistory.sol";

contract IVerifier {
  function verifyProof(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[4] memory input) public returns(bool);
}

contract Mixer is MerkleTreeWithHistory {
  uint256 public transferValue;
  mapping(uint256 => bool) public nullifiers;
  // we store all commitments just to prevent accidental deposits with the same commitment
  mapping(uint256 => bool) public commitments;
  IVerifier verifier;

  event Deposit(uint256 indexed commitment, uint256 leafIndex);
  event Withdraw(address to, uint256 nullifier, uint256 fee);

  /**
    @dev The constructor
    @param _verifier the address of SNARK verifier for this contract
    @param _transferValue the value for all deposits in this contract in wei
  */
  constructor(
    address _verifier,
    uint256 _transferValue,
    uint8 _merkleTreeHeight,
    uint256 _emptyElement
  ) MerkleTreeWithHistory(_merkleTreeHeight, _emptyElement) public {
    verifier = IVerifier(_verifier);
    transferValue = _transferValue;
  }

  /**
    @dev Deposit funds into mixer. The caller must send value equal to `transferValue` of this mixer.
    @param commitment the note commitment, which is PedersenHash(nullifier + secret)
  */
  function deposit(uint256 commitment) public payable {
    require(msg.value == transferValue, "Please send `transferValue` ETH along with transaction");
    require(!commitments[commitment], "The commitment has been submitted");
    _insert(commitment);
    commitments[commitment] = true;
    emit Deposit(commitment, next_index - 1);
  }

  /**
    @dev Withdraw deposit from the mixer. `a`, `b`, and `c` are zkSNARK proof data, and input is an array of circuit public inputs
    `input` array consists of:
      - merkle root of all deposits in the mixer
      - unique deposit nullifier to prevent double spends
      - the receiver of funds
      - optional fee that goes to the transaction sender (usually a relay)
  */
  function withdraw(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[4] memory input) public {
    uint256 root = input[0];
    uint256 nullifier = input[1];
    address payable receiver = address(input[2]);
    uint256 fee = input[3];

    require(fee < transferValue, "Fee exceeds transfer value");
    require(!nullifiers[nullifier], "The note has been already spent");
    require(isKnownRoot(root), "Cannot find your merkle root"); // Make sure to use a recent one
    require(verifier.verifyProof(a, b, c, input), "Invalid withdraw proof");

    nullifiers[nullifier] = true;
    receiver.transfer(transferValue - fee);
    if (fee > 0) {
      msg.sender.transfer(fee);
    }
    emit Withdraw(receiver, nullifier, fee);
  }

  function isSpent(uint256 nullifier) public view returns(bool) {
    return nullifiers[nullifier];
  }
}
