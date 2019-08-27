/* global artifacts, web3, contract */
require('chai')
  .use(require('bn-chai')(web3.utils.BN))
  .use(require('chai-as-promised'))
  .should()
const fs = require('fs')

const { toBN, toHex, randomHex } = require('web3-utils')
const { takeSnapshot, revertSnapshot } = require('../lib/ganacheHelper')

const Mixer = artifacts.require('./ETHMixer.sol')
const { ETH_AMOUNT, MERKLE_TREE_HEIGHT, EMPTY_ELEMENT } = process.env

const websnarkUtils = require('websnark/src/utils')
const buildGroth16 = require('websnark/src/groth16')
const stringifyBigInts = require('websnark/tools/stringifybigint').stringifyBigInts
const unstringifyBigInts2 = require('snarkjs/src/stringifybigint').unstringifyBigInts
const snarkjs = require('snarkjs')
const bigInt = snarkjs.bigInt
const crypto = require('crypto')
const circomlib = require('circomlib')
const MerkleTree = require('../lib/MerkleTree')

const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))
const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

function generateDeposit() {
  let deposit = {
    secret: rbigint(31),
    nullifier: rbigint(31),
  }
  const preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(preimage)
  return deposit
}

// eslint-disable-next-line no-unused-vars
function BNArrayToStringArray(array) {
  const arrayToPrint = []
  array.forEach(item => {
    arrayToPrint.push(item.toString())
  })
  return arrayToPrint
}

function getRandomReceiver() {
  let receiver = rbigint(20)
  while (toHex(receiver.toString()).length !== 42) {
    receiver = rbigint(20)
  }
  return receiver
}

function snarkVerify(proof) {
  proof = unstringifyBigInts2(websnarkUtils.fromSolidityInput(proof))
  const verification_key = unstringifyBigInts2(require('../build/circuits/withdraw_verification_key.json'))
  return snarkjs['groth'].isValid(verification_key, proof, proof.publicSignals)
}

contract('ETHMixer', accounts => {
  let mixer
  const sender = accounts[0]
  const operator = accounts[0]
  const levels = MERKLE_TREE_HEIGHT || 16
  const zeroValue = EMPTY_ELEMENT || 1337
  const value = ETH_AMOUNT || '1000000000000000000' // 1 ether
  let snapshotId
  let prefix = 'test'
  let tree
  const fee = bigInt(ETH_AMOUNT).shr(1) || bigInt(1e17)
  const receiver = getRandomReceiver()
  const relayer = accounts[1]
  let groth16
  let circuit
  let proving_key

  before(async () => {
    tree = new MerkleTree(
      levels,
      zeroValue,
      null,
      prefix,
    )
    mixer = await Mixer.deployed()
    snapshotId = await takeSnapshot()
    groth16 = await buildGroth16()
    circuit = require('../build/circuits/withdraw.json')
    proving_key = fs.readFileSync('build/circuits/withdraw_proving_key.bin').buffer
  })

  describe('#constructor', () => {
    it('should initialize', async () => {
      const etherDenomination = await mixer.etherDenomination()
      etherDenomination.should.be.eq.BN(toBN(value))
    })
  })

  describe('#deposit', () => {
    it('should emit event', async () => {
      let commitment = 42
      let { logs } = await mixer.deposit(commitment, { value, from: sender })

      logs[0].event.should.be.equal('Deposit')
      logs[0].args.commitment.should.be.eq.BN(toBN(commitment))
      logs[0].args.leafIndex.should.be.eq.BN(toBN(0))

      commitment = 12;
      ({ logs } = await mixer.deposit(commitment, { value, from: accounts[2] }))

      logs[0].event.should.be.equal('Deposit')
      logs[0].args.commitment.should.be.eq.BN(toBN(commitment))
      logs[0].args.leafIndex.should.be.eq.BN(toBN(1))
    })

    it('should not deposit if disabled', async () => {
      let commitment = 42;
      (await mixer.isDepositsEnabled()).should.be.equal(true)
      const err = await mixer.toggleDeposits({ from: accounts[1] }).should.be.rejected
      err.reason.should.be.equal('unauthorized')
      await mixer.toggleDeposits({ from: sender });
      (await mixer.isDepositsEnabled()).should.be.equal(false)
      let error = await mixer.deposit(commitment, { value, from: sender }).should.be.rejected
      error.reason.should.be.equal('deposits disabled')
    })

    it('should throw if there is a such commitment', async () => {
      const commitment = 42
      await mixer.deposit(commitment, { value, from: sender }).should.be.fulfilled
      const error = await mixer.deposit(commitment, { value, from: sender }).should.be.rejected
      error.reason.should.be.equal('The commitment has been submitted')
    })
  })

  describe('snark proof verification on js side', () => {
    it('should detect tampering', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      const { root, path_elements, path_index } = await tree.path(0)

      const input = stringifyBigInts({
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        nullifier: deposit.nullifier,
        receiver,
        fee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })

      let proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const originalProof = JSON.parse(JSON.stringify(proof))
      let result = snarkVerify(proof)
      result.should.be.equal(true)

      // nullifier
      proof.publicSignals[1] = '133792158246920651341275668520530514036799294649489851421007411546007850802'
      result = snarkVerify(proof)
      result.should.be.equal(false)
      proof = originalProof

      // try to cheat with recipient
      proof.publicSignals[2] = '133738360804642228759657445999390850076318544422'
      result = snarkVerify(proof)
      result.should.be.equal(false)
      proof = originalProof

      // fee
      proof.publicSignals[3] = '1337100000000000000000'
      result = snarkVerify(proof)
      result.should.be.equal(false)
      proof = originalProof
    })
  })

  describe('#withdraw', () => {
    it('should work', async () => {
      const deposit = generateDeposit()
      const user = accounts[4]
      await tree.insert(deposit.commitment)

      const balanceUserBefore = await web3.eth.getBalance(user)

      // Uncomment to measure gas usage
      // let gas = await mixer.deposit.estimateGas(toBN(deposit.commitment.toString()), { value, from: user, gasPrice: '0' })
      // console.log('deposit gas:', gas)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: user, gasPrice: '0' })

      const balanceUserAfter = await web3.eth.getBalance(user)
      balanceUserAfter.should.be.eq.BN(toBN(balanceUserBefore).sub(toBN(value)))

      const { root, path_elements, path_index } = await tree.path(0)

      // Circuit input
      const input = stringifyBigInts({
        // public
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        receiver,
        fee,

        // private
        nullifier: deposit.nullifier,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })


      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)

      const balanceMixerBefore = await web3.eth.getBalance(mixer.address)
      const balanceRelayerBefore = await web3.eth.getBalance(relayer)
      const balanceOperatorBefore = await web3.eth.getBalance(operator)
      const balanceRecieverBefore = await web3.eth.getBalance(toHex(receiver.toString()))
      let isSpent = await mixer.isSpent(input.nullifierHash.toString(16).padStart(66, '0x00000'))
      isSpent.should.be.equal(false)

      // Uncomment to measure gas usage
      // gas = await mixer.withdraw.estimateGas(pi_a, pi_b, pi_c, publicSignals, { from: relayer, gasPrice: '0' })
      // console.log('withdraw gas:', gas)
      const { logs } = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer, gasPrice: '0' })

      const balanceMixerAfter = await web3.eth.getBalance(mixer.address)
      const balanceRelayerAfter = await web3.eth.getBalance(relayer)
      const balanceOperatorAfter = await web3.eth.getBalance(operator)
      const balanceRecieverAfter = await web3.eth.getBalance(toHex(receiver.toString()))
      const feeBN = toBN(fee.toString())
      balanceMixerAfter.should.be.eq.BN(toBN(balanceMixerBefore).sub(toBN(value)))
      balanceRelayerAfter.should.be.eq.BN(toBN(balanceRelayerBefore))
      balanceOperatorAfter.should.be.eq.BN(toBN(balanceOperatorBefore).add(feeBN))
      balanceRecieverAfter.should.be.eq.BN(toBN(balanceRecieverBefore).add(toBN(value)).sub(feeBN))


      logs[0].event.should.be.equal('Withdraw')
      logs[0].args.nullifierHash.should.be.eq.BN(toBN(input.nullifierHash.toString()))
      logs[0].args.fee.should.be.eq.BN(feeBN)
      isSpent = await mixer.isSpent(input.nullifierHash.toString(16).padStart(66, '0x00000'))
      isSpent.should.be.equal(true)
    })

    it('should prevent double spend', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: sender })

      const { root, path_elements, path_index } = await tree.path(0)

      const input = stringifyBigInts({
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        nullifier: deposit.nullifier,
        receiver,
        fee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })
      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)
      await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.fulfilled
      const error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('The note has been already spent')
    })

    it('should prevent double spend with overflow', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: sender })

      const { root, path_elements, path_index } = await tree.path(0)

      const input = stringifyBigInts({
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        nullifier: deposit.nullifier,
        receiver,
        fee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })
      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)
      publicSignals[1] ='0x' + toBN(publicSignals[1]).add(toBN('21888242871839275222246405745257275088548364400416034343698204186575808495617')).toString('hex')
      const error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('verifier-gte-snark-scalar-field')
    })

    it('fee should be less or equal transfer value', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: sender })

      const { root, path_elements, path_index } = await tree.path(0)
      const oneEtherFee = bigInt(1e18) // 1 ether
      const input = stringifyBigInts({
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        nullifier: deposit.nullifier,
        receiver,
        fee: oneEtherFee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })

      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)
      const error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('Fee exceeds transfer value')
    })

    it('should throw for corrupted merkle tree root', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: sender })

      const { root, path_elements, path_index } = await tree.path(0)

      const input = stringifyBigInts({
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        root,
        nullifier: deposit.nullifier,
        receiver,
        fee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })

      const dummyRoot = randomHex(32)
      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      const { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)
      publicSignals[0] = dummyRoot

      const error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('Cannot find your merkle root')
    })

    it('should reject with tampered public inputs', async () => {
      const deposit = generateDeposit()
      await tree.insert(deposit.commitment)
      await mixer.deposit(toBN(deposit.commitment.toString()), { value, from: sender })

      let { root, path_elements, path_index } = await tree.path(0)

      const input = stringifyBigInts({
        root,
        nullifierHash: pedersenHash(deposit.nullifier.leInt2Buff(31)),
        nullifier: deposit.nullifier,
        receiver,
        fee,
        secret: deposit.secret,
        pathElements: path_elements,
        pathIndex: path_index,
      })
      const proof = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
      let { pi_a, pi_b, pi_c, publicSignals } = websnarkUtils.toSolidityInput(proof)
      const originalPublicSignals = publicSignals.slice()
      const originalPi_a = pi_a.slice()

      // receiver
      publicSignals[2] = '0x0000000000000000000000007a1f9131357404ef86d7c38dbffed2da70321337'

      let error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('Invalid withdraw proof')

      // fee
      publicSignals = originalPublicSignals.slice()
      publicSignals[3] = '0x000000000000000000000000000000000000000000000000015345785d8a0000'

      error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('Invalid withdraw proof')

      // nullifier
      publicSignals = originalPublicSignals.slice()
      publicSignals[1] = '0x00abdfc78211f8807b9c6504a6e537e71b8788b2f529a95f1399ce124a8642ad'

      error = await mixer.withdraw(pi_a, pi_b, pi_c, publicSignals, { from: relayer }).should.be.rejected
      error.reason.should.be.equal('Invalid withdraw proof')

      // proof itself
      pi_a[0] = '0x261d81d8203437f29b38a88c4263476d858e6d9645cf21740461684412b31337'
      await mixer.withdraw(pi_a, pi_b, pi_c, originalPublicSignals, { from: relayer }).should.be.rejected

      // should work with original values
      await mixer.withdraw(originalPi_a, pi_b, pi_c, originalPublicSignals, { from: relayer }).should.be.fulfilled
    })
  })

  describe('#changeOperator', () => {
    it('should work', async () => {
      let operator = await mixer.operator()
      operator.should.be.equal(sender)

      const newOperator = accounts[7]
      await mixer.changeOperator(newOperator).should.be.fulfilled

      operator = await mixer.operator()
      operator.should.be.equal(newOperator)
    })

    it('cannot change from different address', async () => {
      let operator = await mixer.operator()
      operator.should.be.equal(sender)

      const newOperator = accounts[7]
      const error = await mixer.changeOperator(newOperator, { from:  accounts[7] }).should.be.rejected
      error.reason.should.be.equal('unauthorized')

    })
  })

  afterEach(async () => {
    await revertSnapshot(snapshotId.result)
    // eslint-disable-next-line require-atomic-updates
    snapshotId = await takeSnapshot()
    tree = new MerkleTree(
      levels,
      zeroValue,
      null,
      prefix,
    )
  })
})
