// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockZKVerifier {
    bool public shouldVerify = true;

    function setResult(bool _value) external {
        shouldVerify = _value;
    }

    function verifyProof(
        bytes calldata,
        bytes32[] calldata
    ) external view returns (bool) {
        return shouldVerify;
    }
}
