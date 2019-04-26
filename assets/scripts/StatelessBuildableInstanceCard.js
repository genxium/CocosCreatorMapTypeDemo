module.export = cc.Class({
  extends: cc.Component,
  
  properties: {
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label, 
      default: null,
    },
    buildingOrUpgradingRequiredResidentsCountLabel: {
      type: cc.Label, 
      default: null,
    },
    requiredTimeLabel: {
      type: cc.Label, 
      default: null,
    },
    requiredGoldLabel: {
      type: cc.Label, 
      default: null,
    },
  },

  init(mapIns, statelessBuildableInstanceCardListScriptIns, fromStatelessBuildableInstance) {
    const defaultLv = 1;
    this.mapIns = mapIns;
    this.statelessBuildableInstanceCardListScriptIns = statelessBuildableInstanceCardListScriptIns;
    this.displayNameLabel.string = fromStatelessBuildableInstance.displayName; 
    this.buildingOrUpgradingRequiredResidentsCountLabel.string = fromStatelessBuildableInstance.buildingOrUpgradingRequiredResidentsCount[defaultLv]; 
    this.requiredTimeLabel.string = window.secondsToNaturalExp(fromStatelessBuildableInstance.buildingOrUpgradingDuration[defaultLv], false); 
    this.activeAppearanceSprite.spriteFrame = fromStatelessBuildableInstance.appearance[defaultLv];
    this.singleStatelessBuildableInstance = fromStatelessBuildableInstance;
  },  
 
  onCardClicked(evt) {
    const self = this;
    self.mapIns.startPositioningNewStatefulBuildableInstance(self.singleStatelessBuildableInstance);
    self.statelessBuildableInstanceCardListScriptIns.onCloseClicked();
  },  

});
