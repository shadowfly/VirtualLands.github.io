angular.module('OTEHP', [])

.controller('MainController', function($scope, $location) {
  $scope.$location = $location;

  $scope.tokenInfos = []; // id of token => object of infos
  $scope.initialPrice = 10; //in finney

  // Main canvas 
  $scope.cHOTID = 0; // currently hovered over token iD

  $scope.updateCHOTID = function (currentlyHoveredOverTokenID) {
    $scope.cHOTID = currentlyHoveredOverTokenID; 
    $scope.$apply();
  }

  $scope.cHOTID_clicked = 0; 

  $scope.updateCHOTID_clicked = function () {
    $scope.cHOTID_clicked = $scope.cHOTID 
    $scope.$apply();
  }

  // Big pixels canvas

  $scope.cHOSquare = 0; // currently hovered over square

  $scope.updateCHOSquare = function (currentlyHoveredOverSquare) {
    $scope.cHOSquare = currentlyHoveredOverSquare; 
    $scope.$apply();
  }  

  $scope.getEvents = function () {
    VTLContract.deployed().then(function(instance) {
      instance.EmitChangedPixelsColors({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitInitialAuction event handler: ' + error);
        else {
          VTLContract.deployed().then(function(instance) {
            return instance.tokenToPixelsColors.call(eventResult.args._tokenId);
          }).then(function(result) {
            //console.log(eventResult.args._tokenId)
            //console.log(result)
            $scope.tokenInfos[eventResult.args._tokenId].colorsString = result;
            $scope.tokenInfos[eventResult.args._tokenId].colorsArray = stringToArrayOfStrings(result);
            paintCanvasSquareFromEvents(eventResult.args._tokenId, $scope.tokenInfos[eventResult.args._tokenId].colorsArray);
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitChangedDescription({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitChangedDescription event handler: ' + error);
        else {
          VTLContract.deployed().then(function(instance) {
            return instance.tokenToDescription.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].description = result;
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitChangedLink({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitChangedLink event handler: ' + error);
        else {
          VTLContract.deployed().then(function(instance) {
            return instance.tokenToLink.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].link = result;
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitBought({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitInitialAuction event handler: ' + error);
        else {
          console.log('VitualLand bought')
          $scope.tokenInfos[eventResult.args._tokenId] = {
            owner : ""
          };

          VTLContract.deployed().then(function(instance) {
            return instance.ownerOf.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].owner = result;
            if($scope.tokenInfos[eventResult.args._tokenId].colorsArray == null) {
              $scope.tokenInfos[eventResult.args._tokenId].colorsArray = [];
            }

            if($scope.tokenInfos[eventResult.args._tokenId].description == null) {
              $scope.tokenInfos[eventResult.args._tokenId].description = "";
            }

            if($scope.tokenInfos[eventResult.args._tokenId].link == null) {
              $scope.tokenInfos[eventResult.args._tokenId].link = "";
            }

            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

    }).catch(function(err) {
      console.log(err.message);
    });
  }

  $scope.infosPopUp = false;

  $scope.showInfosPopUp = function () {
    $scope.infosPopUp = true;
    $scope.$apply();
  }

  $scope.hideInfosPopUp = function () {
    $scope.infosPopUp = false;
    $scope.$apply();
  }

  $scope.buyToken = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("账户未解锁，请登录MataMask并指定交易账户。")
        } else {
          VTLContract.deployed().then(function(instance) {              
            return  instance.initialPrice();
          }).then(function(initialPrice){
            $scope.initialPrice = web3.fromWei(initialPrice,'finney');
            $scope.$apply();
            console.log("地块初始发售价格查询结果： " + $scope.initialPrice + "finney");                 
          }).catch(function(err) {
            console.log(err.message);
            alert('购买地块时出错。');
          });

          VTLContract.deployed().then(function(instance) {                              
            return instance.initialBuyToken($scope.cHOTID_clicked, {from: accounts[0], value: web3.toWei($scope.initialPrice, "finney") });
          }).then(function(result) {
            alert('地块购买成功!');         
          }).catch(function(err) {
            console.log(err.message);
            alert('购买地块时出错。');
          });
        }
      }
    });
  }

  $scope.saveColors = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("账户未解锁，请登录MataMask并指定交易账户。")
        } else {
          VTLContract.deployed().then(function(instance) {
            var _newColors = arrayOfColorsToString($scope.tokenInfos[$scope.cHOTID_clicked].colorsArray)
            
            return instance.setTokenPixelsColors($scope.cHOTID_clicked, _newColors, {from: accounts[0] });
          }).then(function(result) {
            alert('地块图案修改成功!');
          }).catch(function(err) {
            console.log(err.message);
            alert('修改地块图案时出错。');
          });
        }
      }
    });
  }

  $scope.saveDescription = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("账户未解锁，请登录MataMask并指定交易账户。")
        } else {
          VTLContract.deployed().then(function(instance) {
            var _newDescription = $scope.tokenInfos[$scope.cHOTID_clicked].description;
            
            return instance.setTokenDescription($scope.cHOTID_clicked, _newDescription, {from: accounts[0] });
          }).then(function(result) {
            alert('描述修改成功!');       
          }).catch(function(err) {
            console.log(err.message);
            alert('修改描述时出错。');
          });
        }
      }
    });
  }

  $scope.saveLink = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("账户未解锁，请登录MataMask并指定交易账户。")
        } else {
          VTLContract.deployed().then(function(instance) {
            var _newLink = $scope.tokenInfos[$scope.cHOTID_clicked].link;
            
            return instance.setTokenLink($scope.cHOTID_clicked, _newLink, {from: accounts[0] });
          }).then(function(result) {
            alert('链接修改成功!');       
          }).catch(function(err) {
            console.log(err.message);
            alert('链接修改时出错。');
          });
        }
      }
    });
  }

  $scope.currentAccount = "";

  $scope.setCurrentUnlockedAccount = function (currentlyUnlockedAccount) {
    $scope.currentAccount = currentlyUnlockedAccount;
    $scope.$apply();
  }

  initWeb3();
});