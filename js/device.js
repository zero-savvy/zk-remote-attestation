
const Tx = require('ethereumjs-tx').Transaction
const Web3 = require('web3')
const web3 = new Web3('<endpoint>')
const account1 = '<address 1>'
const account2 = '<address 2>'
const privateKey1 = Buffer.from('<private key 1>', 'hex')
const privateKey2 = Buffer.from('<private key 2>', 'hex')
web3.eth.getTransactionCount(account1, (err, txCount) => {
// Build a transaction
const txObject = {
     nonce: web3.utils.toHex(txCount),
     to: account2,
     value: web3.utils.toHex(web3.utils.toWei('1', 'ether')),
     gasLimit: web3.utils.toHex(21000),
     gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
}
// Sign the transaction
const tx = new Tx(txObject, { chain: 'ropsten' })
tx.sign(privateKey1)
const serializedTransaction = tx.serialize()
const raw = '0x' + serializedTransaction.toString('hex')
// Broadcast the transaction
web3.eth.sendSignedTransaction(raw, (err, txHash) => {
     console.log('txHash: ', txHash)
     console.log(err)
    })
})
