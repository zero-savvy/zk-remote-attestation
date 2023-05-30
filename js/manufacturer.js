const {sha256, privToAddr, modSNARK} = require('./utils');
const bip39 = require('bip39');
const HDKey = require('hdkey');


function createChallenges(numAtts){
    let challenges = [];
    challenges.push('0x' + '1234567890abcdef');
    for (let i = 0; i < numAtts; i++) {
        challenges.push(modSNARK('0x' + sha256([challenges[0], challenges[i]])));
    }
    return challenges.slice(1);
}

function createResponse(challenge, childSecret, currentPCR) {
    return modSNARK('0x0000000000000000000000000000000000000000000000000000000000000000');
    // return '0x' + sha256([challenge, childSecret, currentPCR]).toString('hex');
}

function createDeviceKeys(numKeys) {

    let childPublicKeys = [];
    let childPrivateKeys = [];
    let childAddresses = [];
    console.log(`------------------------------------------------`);
    console.log(`Generating seed phrases for the Master key . . .`);
    let mnemonic = bip39.generateMnemonic();
    console.log(`Generated Mnemonic phrase is as follows.`);
    console.log(`PLease remember it in order ro retreive all devices' keys:`);
    console.log(`${mnemonic}`);
    let seed = bip39.mnemonicToSeedSync(mnemonic);
    const master = HDKey.fromMasterSeed(seed);
    console.log(`Master Private Key: ${master.privateExtendedKey}`);
    console.log(`Master Public Key: ${master.publicExtendedKey}`);
    console.log(`------------------------------------------------`);
    for (let i = 0; i < numKeys; i++) {
        const child = master.deriveChild(i);
        console.debug(child.publicKey);
        console.debug('0x' + child.publicKey.toString('hex'));
        console.debug("--------");
        childPublicKeys.push('0x' + child.publicKey.toString('hex'));
        childPrivateKeys.push('0x' + child.privateKey.toString('hex'));
        childAddresses.push(privToAddr(child.privateKey.toString('hex')));
    }
    return {childPrivateKeys, childPublicKeys, childAddresses};
}

module.exports = {
    createChallenges,
    createDeviceKeys,
    createResponse
}