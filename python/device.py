from eth_account import Account
import web3

w3 = web3.Web3(web3.Web3.HTTPProvider("https://sepolia.infura.io/v3/0776cf37dfb04efdacd478388c7c1dec"))

privkey = '389707fa396b315576e8258b1f6f88e067f383f45a410b71971f49b1a34ca108'

abi = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256","name":"newRoot","type":"uint256"}],"name":"addRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[2]","name":"_pA","type":"uint256[2]"},{"internalType":"uint256[2]","name":"_pB1","type":"uint256[2]"},{"internalType":"uint256[2]","name":"_pB2","type":"uint256[2]"},{"internalType":"uint256[2]","name":"_pC","type":"uint256[2]"},{"internalType":"uint256[3]","name":"_pubSignals","type":"uint256[3]"}],"name":"attest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"name":"checkRoot","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestChallenge","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"challenge","type":"uint256"}],"name":"publishChallenge","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"valitRoots","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'
deployed_addr = '0x5A0f87fDfc22523Ad72b3EA759abe8020903bb72'
acc = Account.from_key(privkey)
attestor = w3.eth.contract(address=w3.to_checksum_address(deployed_addr), abi=abi)
chainId = w3.eth.chain_id

tx = attestor.functions.attest(
    [0x02a29c1d1b830cb96dd352fdc8b3ae574b77a2ed5376f63938005d53bd4fe45c,
     0x244dc94e1731e11f5e5827697ca88f56f2d1ca3ab4afa9792050a05c718f31cb],
    [0x023955014627bea96abf6532954f386bd814f6437e4f7b47b5b7d4ad6ade1c55,
     0x0008310592faad462ca164051e4167cac0c35014f159ca75a3bb751a67f2d53c],
    [0x057131e504b5f1fd2e216f6203c2729b39fd6b8e4910940c2d42a411cb28aecc,
     0x0fa666b167848ea0dd183d6fa11e20e29211f3c65d6011873925455d62d9913a],
    [0x10ba55ca35194d8d7ad4b9c7d125bcd88f1b137acbc865ff999446c38777865d,
     0x18a3ebce32bab6f3e40ede788cf607bccd9e93d650ed32f108ad7dd46978acd8],
    [0x0da1307aee9bf64db585f1b4bf21b14a68f2142f0df1003643aad01292afedfb,
     0x000000000000000000000000e572ed5cd7004c0d04c731aeff1eac70f531ce93,
     0x1bb6d29e97bf1bac8f5f7492fcfd4f45af982f6f0c8d1edd783c14d81ffffffe]
).build_transaction(
    {
        'nonce': w3.eth.get_transaction_count(acc.address),
        'gasPrice': w3.eth.gas_price,
        'gas': 1_000_000,
        'from': acc.address,
        'value': 0,
        'chainId': chainId
    }
)
print(tx)
signed_tx = Account.sign_transaction(tx, privkey)
# print(signed_tx)

tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
print(tx_hash.hex())
