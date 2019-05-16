const CloseableDialog = require('./CloseableDialog');
module.export = cc.Class({
  extends: CloseableDialog,

  properties: {
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label,
      default: null,
    },
    currentLevelLabel: {
      type: cc.Label,
      default: null,
    },
    buildingOrUpgradeRemainingTime: {
      type: cc.ProgressBar,
      default: null,
    },
    remaingLabel: {
      type: cc.Label,
      default: null,
    },
    buildingOrUpgradingInfo: {
      type:cc.Node,
      default: null,
    },
    upgradeButton: {
      type: cc.Button,
      default: null,
    },
    cancelButton: {
      type: cc.Button,
      default: null,
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
    this.initButtonListener();
    this.refreshInteractableButton();
  },

  setInfo(statefulBuildableInstance) {
    this.displayNameLabel.string = statefulBuildableInstance.displayName;
    this.currentLevelLabel.string = statefulBuildableInstance.currentLevel;
    this.activeAppearanceSprite.spriteFrame = statefulBuildableInstance.activeAppearance;
    this.buildingOrUpgradingDuration = statefulBuildableInstance.buildingOrUpgradingDuration[statefulBuildableInstance.currentLevel];
    this.buildingOrUpgradingStartedAt = statefulBuildableInstance.buildingOrUpgradingStartedAt;
    this.buildingOrUpgradingInfo.active = true;
    this.statefulBuildableInstance = statefulBuildableInstance;
  },

  update(){
    if(!this.buildingOrUpgradingStartedAt){ //还未建造。
      this.buildingOrUpgradeRemainingTime.progress = 0;
      this.remaingLabel.string = secondsToNaturalExp(this.buildingOrUpgradingDuration);
      this.refreshInteractableButton();
      return;
    }
    const durationMillis = this.buildingOrUpgradingDuration * 1000; //this.buildingOrUpgradingDuration 单位: second
    const startedAtMillis = this.buildingOrUpgradingStartedAt ;
    const currentGMTMillis = Date.now();
    const elapsedMillis = currentGMTMillis - startedAtMillis; 
    let remainingMillis = durationMillis - elapsedMillis;
    if(0 >= remainingMillis) {
      remainingMillis = 0;
     }
    let currentProgress = parseFloat(elapsedMillis / durationMillis); 
    if (1 <= currentProgress){
      currentProgress = 1.0;
    }
    this.buildingOrUpgradeRemainingTime.progress= currentProgress;  
    if(1 > currentProgress){
      this.remaingLabel.string = secondsToNaturalExp(remainingMillis / 1000);
    }else {
      this.remaingLabel.string = "";
    }
    this.refreshInteractableButton();
  },

  initButtonListener() {
    const self = this;
    // Initialization of the 'upgradeButton' [begins].
    let upgradeHandler = new cc.Component.EventHandler();
    upgradeHandler.target = self.statefulBuildableInstance.mapIns.node;
    upgradeHandler.component = self.statefulBuildableInstance.mapIns.node.name;
    upgradeHandler.handler = 'upgradeStatefulBuildableInstance';
    upgradeHandler.customEventData = self.statefulBuildableInstance;
    self.upgradeButton.clickEvents = [
      upgradeHandler,
    ];
    
    // Initialization of the 'upgradeHandler' [ends].
  },

  refreshInteractableButton() {
    this.refreshUpgradeButton();
    this.refreshCancelButton();
  },

  refreshUpgradeButton() {
    const self = this;
    if (!self.buildingOrUpgradingStartedAt || !self.statefulBuildableInstance.isUpgradable()) {
      self.upgradeButton.node.active = false;
    } else {
      let nextLevel = self.statefulBuildableInstance.currentLevel + 1;
      if (
        self.statefulBuildableInstance.state == window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING
     || !(nextLevel in self.statefulBuildableInstance.buildingOrUpgradingDuration)
      ) {
        self.upgradeButton.node.active = false;
      } else {
        self.upgradeButton.node.active = true;
      } 
    }
  },

  refreshCancelButton() {
    const self = this;
    if (!self.buildingOrUpgradingStartedAt) {
      self.cancelButton.node.active = false;
    } else {
      if (self.statefulBuildableInstance.state == window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING) {
        self.cancelButton.node.active = true;
      } else {
        self.cancelButton.node.active = false;
      }
    }
  },
});
