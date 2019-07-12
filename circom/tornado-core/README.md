## Testing
1. `npm i`
2. `npm run build:circuit` (or `cp Verifier.sol.temp build/circuits/Verifier.sol`)
2. `npx truffle compile`
3. `npx truffle test` - it may fail for the first time, just run one more time.

## Deploy
1. `npx truffle migrate --network kovan --reset`

## Requirements
1. `node v11.15.0`



