// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1;

contract Election {
    string petName;
    string[] petNames;
    mapping(string => uint256) public voteResult;

    function voting(string memory _petName) public {
        petName = _petName;
        if (voteResult[petName] == 0){
            petNames.push(petName);
        }
        voteResult[petName] = voteResult[petName] + 1;
    }

    function getPetResult()
        public
        view
        returns (string memory)
    {
        uint256 maxVote;
        string memory maxVotePet;
        for (uint i = 0; i < petNames.length; i++){
            if (voteResult[petNames[i]] > maxVote){
                maxVote = voteResult[petNames[i]];
                maxVotePet = petNames[i];
            }
        }
        return maxVotePet;
    }
}
