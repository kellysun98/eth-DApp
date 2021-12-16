// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1;

contract Purchase {
    address[16] public buyers;
    mapping(address => uint) public purchaseMap;

    function purchase(uint petId) public payable returns (uint) {
        require (petId >= 0);
        buyers[petId] = msg.sender;
        purchaseMap[msg.sender] = msg.value;
        return petId;
    }

    function getBuyers() public view returns (address[16] memory){
        return buyers;
    }
}

