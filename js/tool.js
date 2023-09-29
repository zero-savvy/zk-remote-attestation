let dict = {
    "root": "",
    "devAddr": "0xe572eD5cD7004C0D04C731AEfF1Eac70F531CE93",
    "response": "0x913d9500593d099452fa9e0f9a515a13211a0f424e3b2188d68985f31e925577",
    "challenge": "0x1bb6d29e97bf1bac8f5f7492fcfd4f45af982f6f0c8d1edd783c14d81ffffffe",
    "pathElements": [
        "0x1a59a5e11a71af1231b640914e0b610fccb8e2948f56dc6d9d78edd04cb2d9ab",
        "0x22b6a8e311a84f944887a78ef3697466a4bc6cb7b33642cc9cac0067301fd32f",
        "0x1b4f49afca3bd11dbb0dd43540c71d73d28bafc49589bb4b8677c386cf836681",
        "0x19d2c0c60ef4ce1a0b315c842e155771a6bfac50ccdc087a5d955e0bf5f6fcf2",
        "0x187c570799c364d7294caac1394a5b6be0825a32970c13d6fd41985c5d726afa",
        "0x2efdaed9e8a0bf1beb2fd4fd23dd3289f6743b90f73d477084c8bfb969a95575",
        "0x2c423f4e6a8039adae5b1dffa40de96d9ec5e32599cb40032c12f40253d8d480",
        "0x2046488fdd6f40fe2e6939e908c2972e81b5e8cbd2c4f96862c3e1b8e8b49719",
        "0xc51866133a77982508401a23a30709bbf045719f11140aa658afb3d85199440",
        "0x223294ffc43b18c42c1a74670e92201964375849083cc7d7a643972202d86b56",
        "0xf22d5a8739fe642523e200bd9878717757888d156ad48dcdd57b7add9e64716",
        "0x20ff9c2e44ca0b09ec165eb3c94aa83e3bc086d08e4eb3310cb125f937a0347c",
        "0xd044d4cfb0f7f9afab8c551e22e5698b95b29b1177246a4c1683bc2a978266a",
        "0x782cad65d67c4b70ca77949af7660fde7ba99769827bdb676143b9fb60a052d",
        "0x135dfd87bbedbec9a4fa43442d13282f264abfcf9db9d5a6c605a420538c6d92",
        "0x20a23e637f25f6f89af532633833fdd0e520d95341e8cd21572a03b1cec89277",
        "0xf197e54e3b96838b92a3e7e06c795447f40477424ae34d3089c869f46c9f93d",
        "0xe6cb82f00d3820677eb210db5817ba1f5c2d10317f9cd00d64a84eec2dd088e",
        "0x2d7ae41cb7c186d0849ccbeef32b29d347ccad42e0cfe6d85319d5950141b4f5",
        "0x2dc38b29ed7800b9a320efef795d7e762fdeffcf4405fb70c13ec1bce68407f7",
        "0x9ac552a79ce3fab2d33fa826bd62c9e9bc134dc387e964c1ceedaa85f9de334",
        "0x11a0f0d4386ff677fc795bdc061a6abd14ce5331cc4d3ea804bd77068db016b6",
        "0x2fc705cf93ac7a858acec8f0c96bbd011a3a78b42555bab5127a7757b9c77b13",
        "0x2f29c1e609c8e785d64d546c1d3a5567157f3faa3c97bc2aa554c0307e2e4fcd",
        "0x249d324a14d45dd18fd60d0ccb6e0f74b97626c2e3b946e758684e99bba3e9fa",
        "0x255339ebec8d859e7093eaa5889722f41206e6cd3d99e6d40800c3ae7bb798f0",
        "0x2e32807d242c8d994fbcfd75d7cd1b9aedab34ffad1f9c61f89a88f41f8ca97a",
        "0xa38388b7956cdb5f79c90621c6358a66e9a4d3ac294491ba1057990a657b805",
        "0x2317fca60fea9ba034fd3b3a91e0e94794f525d1676a994976eb9fb4d7d65826",
        "0x6bba869dae37a78c74b29dacc34e5e769ffbcfcc12c3a729776c96270c470ea"
    ],
    "pathIndices":   [
        "1", "0", "0", "1", "1", "0", "1", "1", "0", "0",
        "1", "0", "0", "1", "1", "0", "0", "1", "1", "1",
        "0", "0", "0", "1", "1", "0", "1", "0", "1", "0"
      ]
}
let left, right;
let hashes = [];
console.log([dict['devAddr'], dict['challenge'], dict['response']]);
let tmp = poseidon([dict['devAddr'], dict['challenge'], dict['response']]);
hashes.push('0x' + tmp.toString(16));
for (let i = 0; i < 30; i++) {
    if(dict['pathIndices'][i] == "0") {
        left = hashes[i];
        right = dict['pathElements'][i];
    } else {
        right = hashes[i];
        left = dict['pathElements'][i];
    }
    // console.log([left, right]);
    hashes.push((poseidon([left, right])));
    console.log(BigInt(hashes[i]).toString(10));
}
console.log(BigInt(hashes[30]).toString(10));
dict["root"] = "0x" + (hashes[30]).toString(16).padStart(64, '0');
// console.log(dict);
// console.log(hashes);

fs.writeFile(`input_sample_30.json`, JSON.stringify(dict, null, 4), err => {
    if (err) {
      throw err
    }
  })
