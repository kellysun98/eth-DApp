// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1; 


contract Donate {
    address payable public owner;
    address payable public curr_owner;
    mapping(address => uint) public donationMap;

    constructor(address payable _owner) public {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function doDonate() public payable returns (uint){
        curr_owner = msg.sender;
        donationMap[curr_owner] = msg.value;
    }

    function withdraw() public payable onlyOwner {
       owner.transfer(address(this).balance);
    }
}
