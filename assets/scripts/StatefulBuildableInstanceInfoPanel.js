const CloseableDialog = require('./CloseableDialog');
const ProgressBar = require('./BuildOrUpgradeProgressBar');
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
    upgradeButton: {
      type: cc.Button,
      default: null,
    },
    cancelButton: {
      type: cc.Button,
      default: null,
    },
    maxLevelLabel: {
      type: cc.Label,
      default: null,
    },
    buildOrUpgradeProgressBar: {
      type: ProgressBar,
      default: null,
    },
    upgradeDurationLabel: {
      type: cc.Label,
      default: null,
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
    this.initButtonListener();
  },

  setInfo(statefulBuildableInstance) {
    this.displayNameLabel.string = statefulBuildableInstance.displayName;
    this.currentLevelLabel.string = statefulBuildableInstance.currentLevel;
    this.activeAppearanceSprite.spriteFrame = statefulBuildableInstance.activeAppearance;
    this.buildingOrUpgradingDuration = statefulBuildableInstance.buildingOrUpgradingDuration[statefulBuildableInstance.currentLevel+1];
    this.buildingOrUpgradingStartedAt = statefulBuildableInstance.buildingOrUpgradingStartedAt;
    this.statefulBuildableInstance = statefulBuildableInstance;

    this.refreshLabelAndProgressBar();
    this.refreshInteractableButton();
  },

  refreshLabelAndProgressBar() {
    this.maxLevelLabel.node.active = false;
    this.upgradeDurationLabel.node.active = false;

    if (!this.buildingOrUpgradingStartedAt) {
      //无需显示进度条
      this.buildOrUpgradeProgressBar.node.active = false;
      if (this.statefulBuildableInstance.isUpgradable()) {
        this.upgradeDurationLabel.node.active = true;
        this.upgradeDurationLabel.string = secondsToNaturalExp(this.buildingOrUpgradingDuration);
      } else {
        this.maxLevelLabel.node.active = true;
      }
    } else {
      this.buildOrUpgradeProgressBar.node.active = true;
      this.buildOrUpgradeProgressBar.setData(this.buildingOrUpgradingStartedAt, this.buildingOrUpgradingDuration * 1000);
    }

  },

  refreshData() {
    this.setInfo(this.statefulBuildableInstance);
  },

  update(){

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
    if (
      self.statefulBuildableInstance.isBuilding()
   || self.statefulBuildableInstance.isUpgrading()
   || self.statefulBuildableInstance.isNewing()
   || !self.statefulBuildableInstance.isUpgradable()
    ) {
      self.upgradeButton.node.active = false;
    } else {
      if (self.statefulBuildableInstance.isUpgradable()) {
        self.upgradeButton.node.active = true;
      }
    }
  },

  refreshCancelButton() {
    const self = this;
    self.cancelButton.node.active = false; // 不显示cancel按钮
    return;
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
