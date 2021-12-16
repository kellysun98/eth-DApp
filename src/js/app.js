App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      console.log(data)
      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        // console.log(petTemplate.find('.pet-sex').text(data[i].sex))
        petTemplate.find('.pet-sex').text(data[i].sex);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.pet-price').text(data[i].price);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-purchase').attr('data-id', data[i].id)

        petsRow.append(petTemplate.html());

      }
      // console.log(petsRow)
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

      return App.withdrawFromContract()
    })

    $.getJSON('Election.json', (data) => {
      const ElectionArtifact = data;
      App.contracts.Election = TruffleContract(ElectionArtifact)
      App.contracts.Election.setProvider(App.web3Provider)
    })

    $.getJSON('Purchase.json', data => {
      const PurchaseArtifact = data;
      App.contracts.Purchase = TruffleContract(PurchaseArtifact)
      App.contracts.Purchase.setProvider(App.web3Provider)
    })

    $.getJSON('Filter.json', data => {
      const FilterArtifact = data
      App.contracts.Filter = TruffleContract(FilterArtifact)
      App.contracts.Filter.setProvider(App.web3Provider)
    })

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt)
    $(document).on('click', '#donate-confirm', App.handleDonate)
    $(document).on('click', '#election-confirm', App.handleElection)
    $(document).on('click', '#election-result-modal', App.showPopularPet)
    $(document).on('click', '.btn-purchase', App.handlePurchase)
    $(document).on('click', '#filter-submit', App.submitFilter)
  },

  withdrawFromContract: function () {
    $.getJSON('../constant.json', (data) => {
      let donateInstance;
      web3.eth.getAccounts((err, accounts) => {
        if (err) {
          console.log(err)
        }
        const account = accounts[0] //当前的account
        if (account === data.hashAddress.toLowerCase()) {
          App.contracts.Donate.deployed().then((instance) => {
            donateInstance = instance;
            return donateInstance.withdraw({ from: account })
          }).catch((err) => {
            console.log(err.message);
          });
        }
      })
    })
  },

  markAdopted: function () {
    let adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Success').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  markPurchased: () => {
    let purchaseInstance;

    App.contracts.Purchase.deployed().then(function (instance) {
      purchaseInstance = instance;

      return purchaseInstance.getBuyers.call();
    }).then(function (buyers) {
      for (i = 0; i < buyers.length; i++) {
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('.btn-purchase').text('Sold').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });    
  },
  
  submitFilter: (e) => {
    e.preventDefault()
    let filterInstance
    let filterInput = $('#filter-input').val() // default as string
    if (filterInput === '') return App.resetRender()
    web3.eth.defaultAccount = web3.eth.accounts[0];
    App.contracts.Filter.deployed().then((instance) => {
      filterInstance = instance
      return filterInstance.getPetInfos()
    }).then((result) => { 
      return App.handleFilter()
    }).catch((err) => {
      console.log(err.message)
    })
  },

  handleFilter: () => {
    let filterInstance
    let filterType = $('#filter-dropdown').val()
    let filterInput = $('#filter-input').val() // default as string
    web3.eth.defaultAccount = web3.eth.accounts[0];
    App.contracts.Filter.deployed().then((instance) => {
      filterInstance = instance
      if (filterType === 'By Breed'){
        return filterInstance.filterByBreed(filterInput)
      } else if (filterType === 'By Age') {
        return filterInstance.filterByAge(parseInt(filterInput))
      } else if (filterType === 'By Sex'){
        return filterInstance.filterBySex(filterInput)
      }
    }).then((result) => { //need reproduction
      const strRes = JSON.stringify(result)
      const arrRes = JSON.parse(strRes)
      const numRes = arrRes.filter(item => {
        return item !== "666"
      }).map(item => parseInt(item))

      return App.renderFilter(numRes)
    }).catch((err) => {
      console.log(err.message)
    })
  },

  renderFilter: (numRes) => {
    $.getJSON('../pets.json', (data) => {
      const renderRes = data.filter(pet => {
        return numRes.includes(pet.id)
      })
      // console.log('11111'+renderRes)
      var petsRow = $('#petsRow').empty();
      var petTemplate = $('#petTemplate');


      for (i = 0; i < renderRes.length; i++) {
        petTemplate.find('.panel-title').text(renderRes[i].name);
        petTemplate.find('img').attr('src', renderRes[i].picture);
        petTemplate.find('.pet-breed').text(renderRes[i].breed);
        petTemplate.find('.pet-age').text(renderRes[i].age);
        petTemplate.find('.pet-location').text(renderRes[i].location);
        petTemplate.find('.pet-sex').text(renderRes[i].sex);
        petTemplate.find('.pet-price').text(renderRes[i].price);
        petTemplate.find('.btn-adopt').attr('data-id', renderRes[i].id);
        petTemplate.find('.btn-purchase').attr('data-id', renderRes[i].id)

        petsRow.append(petTemplate.html());
      }
    })
  },

  resetRender:() => {
    $.getJSON('../pets.json', (data) => {
      var petsRow = $('#petsRow').empty();
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-sex').text(data[i].sex);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.pet-price').text(data[i].price);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-purchase').attr('data-id', data[i].id)

        petsRow.append(petTemplate.html());
      }
    })
  },

  showPopularPet: () => {
    let electionInstance;
    web3.eth.defaultAccount = web3.eth.accounts[0];
    App.contracts.Election.deployed().then((instance) => {
      electionInstance = instance
      return electionInstance.getPetResult()
    }).then((result) => {
      if (result) {
        // $("#election-result").modal('toggle')
        $("#most-pop-pet-name").html(result)
      }
    }).catch((err) => {
      console.log(err.message)
    })
  },

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
        return electionInstance.voting(petName, { from: account })
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

  handlePurchase: (e) => {
    let purchaseInstance;
    const value = parseInt(e.target.parentNode.querySelector('.pet-price').innerHTML)
    const Wei = value * (10 ** 18)
    const petId = parseInt($(e.target).data('id'));
  
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.log(err)
      }
      const account = accounts[0]

      App.contracts.Purchase.deployed().then(function (instance) {
        purchaseInstance = instance;
        return purchaseInstance.purchase(petId, { from: account, value: Wei })
      }).then(function (result) {
        return App.markPurchased();
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
