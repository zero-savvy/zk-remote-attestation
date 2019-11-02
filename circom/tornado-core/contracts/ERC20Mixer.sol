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

pragma solidity ^0.5.8;

import "./Mixer.sol";

contract ERC20Mixer is Mixer {
  address public token;

  constructor(
    IVerifier _verifier,
    uint256 _denomination,
    uint8 _merkleTreeHeight,
    address _operator,
    address _token
  ) Mixer(_verifier, _denomination, _merkleTreeHeight, _operator) public {
    token = _token;
  }

  function _processDeposit() internal {
    require(msg.value == 0, "ETH value is supposed to be 0 for ETH mixer");
    _safeErc20TransferFrom(msg.sender, address(this), denomination);
  }

  function _processWithdraw(address payable _receiver, address payable _relayer, uint256 _fee, uint256 _refund) internal {
    require(msg.value == _refund, "Incorrect refund amount received by the contract");

    _safeErc20Transfer(_receiver, denomination - _fee);
    if (_fee > 0) {
      _safeErc20Transfer(_relayer, _fee);
    }
    if (_refund > 0) {
      _receiver.transfer(_refund);
    }
  }

  function _safeErc20TransferFrom(address _from, address _to, uint256 _amount) internal {
    bool success;
    bytes memory data;
    bytes4 transferFromSelector = 0x23b872dd;
    (success, data) = token.call(
      abi.encodeWithSelector(
        transferFromSelector,
        _from, _to, _amount
      )
    );
    require(success, "not enough allowed tokens");

    // if contract returns some data let's make sure that is `true` according to standard
    if (data.length > 0) {
      assembly {
        success := mload(add(data, 0x20))
      }
      require(success, "not enough allowed tokens");
    }
  }

  function _safeErc20Transfer(address _to, uint256 _amount) internal {
    bool success;
    bytes memory data;
    bytes4 transferSelector = 0xa9059cbb;
    (success, data) = token.call(
        abi.encodeWithSelector(
            transferSelector,
        _to, _amount
        )
    );
    require(success, "not enough tokens");

    // if contract returns some data let's make sure that is `true` according to standard
    if (data.length > 0) {
      assembly {
        success := mload(add(data, 0x20))
      }
      require(success, "not enough tokens");
    }
  }
}
