pragma solidity ^0.5.1; 

contract Election {
    string petName;
    mapping (string => uint) public voteResult;

    function voting (string memory _petName) public {
        petName = _petName;
        voteResult[petName] += 1; 
    }

    function getPetResult (string memory _petName) public returns (uint){
        return voteResult[_petName];
    }
}