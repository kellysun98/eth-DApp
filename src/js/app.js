App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    $.getJSON('../pets.json', (data) => {
      const petNameArr = data.map((pet) => {
        return pet.name
      })
      const select = $('#election-pet-name')
      petNameArr.forEach((petName) => {
        const option = `<option>${petName}</option>`
        select.append(option)
      })
    })

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Adoption.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    $.getJSON('Donate.json', (data) => {
      const DonateArtifact = data;
      App.contracts.Donate = TruffleContract(DonateArtifact)
      App.contracts.Donate.setProvider(App.web3Provider)

      // return App.withdrawFromContract()
    })

    $.getJSON('Election.json', (data) => {
      const ElectionArtifact = data;
      App.contracts.Election = TruffleContract(ElectionArtifact)
      App.contracts.Election.setProvider(App.web3Provider)

      // return App.showPopularPet()
    })

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt)
    $(document).on('click', '#donate-confirm', App.handleDonate)
    $(document).on('click', '#election-confirm', App.handleElection)
  },

  // withdrawFromContract: function () {
  //   let donateInstance;
  //   web3.eth.getAccounts((err, accounts) => {
  //     if (err) {
  //       console.log(err)
  //     }
  //     const account = accounts[0] //当前的account
  //     App.contracts.Donate.deployed().then((instance) => {
  //       donateInstance = instance;
  //         return donateInstance.withdraw({from: account})
  //     }).catch((err) => {
  //       console.log(err.message);
  //     });
  //   })
  // },

  markAdopted: function () {
    let adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  // showPopularPet: () => {
  //   $.getJSON('../pets.json', (data) => {
  //     const petNameArr = data.map((pet) => {
  //       return pet.name
  //     })
  //     const votes = petNameArr.map((petName) => {
  //       let popularInstance;
  //       App.contracts.Election.deployed().then((instance) => {
  //         popularInstance = instance;
  //         return popularInstance.getPetResult(petName)
  //       }).then((result) => {
  //         return {petName, vote: result}
  //       })
  //     })
  //     let mostPopPet = {}
  //     for (let i = 0; i < votes.length; i++){
  //       if (mostPopPet === {}){
  //         mostPopPet = votes[i]
  //       } else {
  //         if (votes[i].vote > mostPopPet.vote){
  //           mostPopPet = votes[i]
  //         }
  //       }
  //     }
  //     const {petName, vote} = mostPopPet
  //     if (petName && vote > 0) {
  //       $('#election-popular').html(petName)
  //       $('#election-pop-result').css('display', 'block')
  //       $('#election-no-result').css('display', 'none')
  //     } 
  //   })
  // },

  handleElection: () => {
    let electionInstance;
    const petName = $('#election-pet-name').val()
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.log(err)
      }
      const account = accounts[0]
      App.contracts.Election.deployed().then((instance) => {
        electionInstance = instance
        return electionInstance.voting(petName, {from: account})
      }).then((result) => {
        if (result) {
          $("#election-alert-success").css('display', 'block');
          $("#election").modal('toggle')
          setTimeout(() => {
            $("#election-alert-success").css('display', 'none');
          }, 5000)
        }
      }).catch((err) => {
        console.log(err.message)
      })
    })

  },

  handleDonate: (e) => {
    let donateInstance;
    const donateValue = $('#donate-input').val()

    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.log(err)
      }
      const account = accounts[0]

      App.contracts.Donate.deployed().then(function (instance) {
        donateInstance = instance;
        return donateInstance.doDonate({ from: account, value: donateValue })
      }).then(function (result) {
        if (result) {
          $("#donate-alert-success").css('display', 'block');
          $("#donate").modal('toggle')
          setTimeout(() => {
            $("#donate-alert-success").css('display', 'none');
          }, 5000)
        }
      }).catch(function (err) {
        console.log(err.message);
      });
    })
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, { from: account });
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
