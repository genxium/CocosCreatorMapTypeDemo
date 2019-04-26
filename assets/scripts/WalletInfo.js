cc.Class({
  extends: cc.Component,

  properties: {
    mapNode: {
      type: cc.Node,
      default: null
    },
    goldNode: {
      type: cc.Node,
      default: null
    }, 
    energyNode: {
      type: cc.Node,
      default: null
    }, 
    goldLabel: {
      type: cc.Label,
      default: null
    }, 
    energyLabel:{
      type: cc.Label,
      default: null
    },
    diamondLabel:{
      type: cc.Label,
      default: null
    },
    goldTip:{
      type: cc.Node,
      default: null
    },
    energyTip:{
      type: cc.Node,
      default: null
    },
    currentEnergyLimitLabel : {
      type: cc.Label,
      default: null,
    },
    currentGoldLimitLabel : {
      type: cc.Label,
      default: null,
    },
  },
   
   updateWalletInfo(wallet) {
      /** update gold [begins] **/
      const goldProgressNumScriptIns = this.goldNode.getComponent("ProgressNum");
      const currentDisplayGold = this.goldLabel.string;
      if(!currentDisplayGold) {
        return;
      }
      this.currentGoldValue = parseInt(currentDisplayGold); 
      goldProgressNumScriptIns.setData(wallet.gold, wallet.currentGoldLimit);
      this.currentGoldLimitLabel.string = wallet.currentGoldLimit;
      /** update gold [ends] **/
      
      /** update energy [begins] **/
      const energyProgressNumScriptIns = this.energyNode.getComponent("ProgressNum");
      const currentDisplayEnergy = this.energyLabel.string;
      if(!currentDisplayEnergy) {
        return;
      }
      this.currentEnergyValue = parseInt(currentDisplayEnergy); 
      energyProgressNumScriptIns.setData(wallet.energy, wallet.currentEnergyLimit);
      this.currentEnergyLimitLabel.string = wallet.currentEnergyLimit;
      /** update energy [ends] **/

      /** update diamond [begins] **/
      this.diamondLabel.string = wallet.diamond;
      /** update diamond [ends] **/
   }, 
   goldButtonOnClick() {
      const self = this;
      if(true == this.goldTip.active) {
        window.removeCurrentlyShowingQuantityLimitPopup();
      }else {
        window.showQuantityLimitPopup(self.goldTip);
        this.mapScriptIns.onSignlePointTouchended = () => {
          window.removeCurrentlyShowingQuantityLimitPopup();
          self.mapScriptIns.onSignlePointTouchended = undefined;
        };
      }
   }, 

   energyButtonOnClick() {
      const self = this;
      if(true == this.energyTip.active) {
        window.removeCurrentlyShowingQuantityLimitPopup();
      }else {
        window.showQuantityLimitPopup(self.energyTip);
        this.mapScriptIns.onSignlePointTouchended = () => {
          window.removeCurrentlyShowingQuantityLimitPopup();
          self.mapScriptIns.onSignlePointTouchended = undefined;
        };
      }
   }, 

});
