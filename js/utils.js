const crypto = require('crypto');


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

function sha256(data) {
    const sha = crypto.createHash('sha256');
    for (let i = 0; i < data.length; i++) {
        sha.update(data[i].slice(2), 'hex');
    }
    return sha.digest('hex');
}

module.exports = {
    sha256,
    nxtPo2
};
