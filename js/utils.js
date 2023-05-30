const crypto = require('crypto');
var ethers = require('ethers');  


function nxtPo2(x) {
    x--;
    x = x | (x >> 1);
    x = x | (x >> 2);
    x = x | (x >> 4);
    x = x | (x >> 8);
    x = x | (x >> 16);
    x = x | (x >> 32);
    x++;
    return x;
}

function privToAddr(priv) {
    var wallet = new ethers.Wallet(priv); 
    return wallet.address;
}

function sha256(data) {
    const sha = crypto.createHash('sha256');
    for (let i = 0; i < data.length; i++) {
        sha.update(data[i].slice(2), 'hex');
    }
    return sha.digest('hex');
}

function modSNARK(hexNum) {
    p = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    res = '0x' + (BigInt(parseInt(hexNum, 16)) % p).toString(16).padStart(64, '0');
    return res;
}

module.exports = {
    sha256,
    nxtPo2,
    privToAddr,
    modSNARK
};
