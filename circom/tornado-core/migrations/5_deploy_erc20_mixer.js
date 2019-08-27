/* global artifacts */
require('dotenv').config({ path: '../.env' })
const ERC20Mixer = artifacts.require('ERC20Mixer')
const Verifier = artifacts.require('Verifier')
const MiMC = artifacts.require('MiMC')
const ERC20Mock = artifacts.require('ERC20Mock')


module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ETH_AMOUNT, EMPTY_ELEMENT, ERC20_TOKEN, TOKEN_AMOUNT } = process.env
    const verifier = await Verifier.deployed()
    const miMC = await MiMC.deployed()
    await ERC20Mixer.link(MiMC, miMC.address)
    let token = ERC20_TOKEN
    if(deployer.network !== 'mainnet') {
      const tokenInstance = await deployer.deploy(ERC20Mock)
      token = tokenInstance.address
    }
    const mixer = await deployer.deploy(
      ERC20Mixer,
      verifier.address,
      ETH_AMOUNT,
      MERKLE_TREE_HEIGHT,
      EMPTY_ELEMENT,
      accounts[0],
      token,
      TOKEN_AMOUNT
    )
    console.log('ERC20Mixer\'s address ', mixer.address)
  })
}
