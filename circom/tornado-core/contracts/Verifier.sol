// https://tornado.cash
/*
* d888888P                                           dP              a88888b.                   dP
*    88                                              88             d8'   `88                   88
*    88    .d8888b. 88d888b. 88d888b. .d8888b. .d888b88 .d8888b.    88        .d8888b. .d8888b. 88d888b.
*    88    88'  `88 88'  `88 88'  `88 88'  `88 88'  `88 88'  `88    88        88'  `88 Y8ooooo. 88'  `88
*    88    88.  .88 88       88    88 88.  .88 88.  .88 88.  .88 dP Y8.   .88 88.  .88       88 88    88
*    dP    `88888P' dP       dP    dP `88888P8 `88888P8 `88888P' 88  Y88888P' `88888P8 `88888P' dP    dP
* ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

library Pairing {
  uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

  struct G1Point {
    uint256 X;
    uint256 Y;
  }

  // Encoding of field elements is: X[0] * z + X[1]
  struct G2Point {
    uint256[2] X;
    uint256[2] Y;
  }

  /*
   * @return The negation of p, i.e. p.plus(p.negate()) should be zero
   */
  function negate(G1Point memory p) internal pure returns (G1Point memory) {
    // The prime q in the base field F_q for G1
    if (p.X == 0 && p.Y == 0) {
      return G1Point(0, 0);
    } else {
      return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
    }
  }

  /*
   * @return r the sum of two points of G1
   */
  function plus(
    G1Point memory p1,
    G1Point memory p2
  ) internal view returns (G1Point memory r) {
    uint256[4] memory input = [
    p1.X, p1.Y,
    p2.X, p2.Y
    ];
    bool success;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
    // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }

    require(success, "pairing-add-failed");
  }

  /*
   * @return r the product of a point on G1 and a scalar, i.e.
   *         p == p.scalarMul(1) and p.plus(p) == p.scalarMul(2) for all
   *         points p.
   */
  function scalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
    uint256[3] memory input = [p.X, p.Y, s];
    bool success;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
    // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }

    require(success, "pairing-mul-failed");
  }

  /* @return The result of computing the pairing check
   *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
   *         For example,
   *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
   */
  function pairing(
    G1Point memory a1,
    G2Point memory a2,
    G1Point memory b1,
    G2Point memory b2,
    G1Point memory c1,
    G2Point memory c2,
    G1Point memory d1,
    G2Point memory d2
  ) internal view returns (bool) {
    uint256[24] memory input = [
    a1.X, a1.Y, a2.X[0], a2.X[1], a2.Y[0], a2.Y[1],
    b1.X, b1.Y, b2.X[0], b2.X[1], b2.Y[0], b2.Y[1],
    c1.X, c1.Y, c2.X[0], c2.X[1], c2.Y[0], c2.Y[1],
    d1.X, d1.Y, d2.X[0], d2.X[1], d2.Y[0], d2.Y[1]
    ];
    uint256[1] memory out;
    bool success;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 8, input, mul(24, 0x20), out, 0x20)
    // Use "invalid" to make gas estimation work
      switch success case 0 { invalid() }
    }

    require(success, "pairing-opcode-failed");
    return out[0] != 0;
  }
}

contract Verifier {
  uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
  uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
  using Pairing for *;

  struct VerifyingKey {
    Pairing.G1Point alfa1;
    Pairing.G2Point beta2;
    Pairing.G2Point gamma2;
    Pairing.G2Point delta2;
    Pairing.G1Point[7] IC;
  }

  function verifyingKey() internal pure returns (VerifyingKey memory vk) {
    vk.alfa1 = Pairing.G1Point(uint256(20692898189092739278193869274495556617788530808486270118371701516666252877969), uint256(11713062878292653967971378194351968039596396853904572879488166084231740557279));
    vk.beta2 = Pairing.G2Point([uint256(12168528810181263706895252315640534818222943348193302139358377162645029937006), uint256(281120578337195720357474965979947690431622127986816839208576358024608803542)], [uint256(16129176515713072042442734839012966563817890688785805090011011570989315559913), uint256(9011703453772030375124466642203641636825223906145908770308724549646909480510)]);
    vk.gamma2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634), uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531), uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
    vk.delta2 = Pairing.G2Point([uint256(21280594949518992153305586783242820682644996932183186320680800072133486887432), uint256(150879136433974552800030963899771162647715069685890547489132178314736470662)], [uint256(1081836006956609894549771334721413187913047383331561601606260283167615953295), uint256(11434086686358152335540554643130007307617078324975981257823476472104616196090)]);
    vk.IC[0] = Pairing.G1Point(uint256(16225148364316337376768119297456868908427925829817748684139175309620217098814), uint256(5167268689450204162046084442581051565997733233062478317813755636162413164690));
    vk.IC[1] = Pairing.G1Point(uint256(12882377842072682264979317445365303375159828272423495088911985689463022094260), uint256(19488215856665173565526758360510125932214252767275816329232454875804474844786));
    vk.IC[2] = Pairing.G1Point(uint256(13083492661683431044045992285476184182144099829507350352128615182516530014777), uint256(602051281796153692392523702676782023472744522032670801091617246498551238913));
    vk.IC[3] = Pairing.G1Point(uint256(9732465972180335629969421513785602934706096902316483580882842789662669212890), uint256(2776526698606888434074200384264824461688198384989521091253289776235602495678));
    vk.IC[4] = Pairing.G1Point(uint256(8586364274534577154894611080234048648883781955345622578531233113180532234842), uint256(21276134929883121123323359450658320820075698490666870487450985603988214349407));
    vk.IC[5] = Pairing.G1Point(uint256(4910628533171597675018724709631788948355422829499855033965018665300386637884), uint256(20532468890024084510431799098097081600480376127870299142189696620752500664302));
    vk.IC[6] = Pairing.G1Point(uint256(15335858102289947642505450692012116222827233918185150176888641903531542034017), uint256(5311597067667671581646709998171703828965875677637292315055030353779531404812));

  }

  /*
   * @returns Whether the proof is valid given the hardcoded verifying key
   *          above and the public inputs
   */
  function verifyProof(
    bytes memory proof,
    uint256[6] memory input
  ) public view returns (bool) {
    uint256[8] memory p = abi.decode(proof, (uint256[8]));
    for (uint8 i = 0; i < p.length; i++) {
      // Make sure that each element in the proof is less than the prime q
      require(p[i] < PRIME_Q, "verifier-proof-element-gte-prime-q");
    }
    Pairing.G1Point memory proofA = Pairing.G1Point(p[0], p[1]);
    Pairing.G2Point memory proofB = Pairing.G2Point([p[2], p[3]], [p[4], p[5]]);
    Pairing.G1Point memory proofC = Pairing.G1Point(p[6], p[7]);

    VerifyingKey memory vk = verifyingKey();
    // Compute the linear combination vkX
    Pairing.G1Point memory vkX = vk.IC[0];
    for (uint256 i = 0; i < input.length; i++) {
      // Make sure that every input is less than the snark scalar field
      require(input[i] < SNARK_SCALAR_FIELD, "verifier-input-gte-snark-scalar-field");
      vkX = Pairing.plus(vkX, Pairing.scalarMul(vk.IC[i + 1], input[i]));
    }

    return Pairing.pairing(
      Pairing.negate(proofA),
      proofB,
      vk.alfa1,
      vk.beta2,
      vkX,
      vk.gamma2,
      proofC,
      vk.delta2
    );
  }
}
