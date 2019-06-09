const StatelessBuildableInstance = require("./StatelessBuildableInstance");

window.INITIAL_STATEFUL_BUILDABLE_LEVEL = 0;

window.STATEFUL_BUILDABLE_INSTANCE_STATE = {
  /* 
   * - At states "BUILDING", "EDITING_WHILE_BUILDING" and "EDITING_PANEL_WHILE_BUILDING", the field "currentLevel" should be 0.
   * - Only states "IDLE", "BUILDING", and "UPGRADING" should be written into persistent storage, and restored from persistent storage, via `StatefulBuildableInstance.playerBuildableBinding.state`.
   */
  IDLE: 1, 
  EDITING_WHILE_NEW: 2,
  BUILDING: 3,
  UPGRADING: 4,
  EDITING: 5,
  EDITING_WHILE_BUILDING: 6,
  EDITING_WHILE_UPGRADING: 7,
  EDITING_PANEL_WHILE_NEW: 8,
  EDITING_PANEL: 9,
  EDITING_PANEL_WHILE_BUILDING: 10,
  EDITING_PANEL_WHILE_UPGRADING: 11,
}; 

const StatefulBuildableInstance = cc.Class({
  extends: StatelessBuildableInstance,

  properties: {
    // Reference for getter/setter overriding https://docs.cocos.com/creator/manual/en/scripting/class.html#getset-declaration.
    editBuildButton: {
      type: cc.Button,
      default: null,
    },
    fixedSpriteCentreContinuousPos: {
      get: function() {
        return (null == this._fixedSpriteCentreContinuousPos ? null : this._fixedSpriteCentreContinuousPos);
      },
      set: function(val) {
        /*
         * WARNING
         *
         * You SHOULDN'T DIRECTLY trigger this setter from outside of `StatefulBuildableInstance` class.
         *
         * -- YFLu
         */
        if (null == val) return;
        const self = this;
        if (!self.mapIns || !self.mapIns.tiledMapIns) return; 
        if (!self.playerBuildableBinding) return;
        self._fixedSpriteCentreContinuousPos = val;
        const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.mapIns.node, self.mapIns.tiledMapIns, val.add(self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));
        self.playerBuildableBinding.topmostTileDiscretePositionX = anchorTileDiscretePos.x;
        self.playerBuildableBinding.topmostTileDiscretePositionY = anchorTileDiscretePos.y;
      },
    },
    state: {
      get: function() {
        return (null == this._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW : this._state);
      },
      set: function(val) {
        /*
         * WARNING
         *
         * You SHOULDN'T DIRECTLY trigger this setter from outside of `StatefulBuildableInstance` class.
         *
         * -- YFLu
         */
        const self = this, modified = self._state && self._state != val;
        self._state = val;
        if (!self.playerBuildableBinding) return;
        switch (val) {
          case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
            self.playerBuildableBinding.state = val;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
            self.playerBuildableBinding.state = val;
            self.showProgressBar();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
            self.playerBuildableBinding.state = val;
            self.initUpgradingAnimation();
            self.showProgressBar();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
            self.playerBuildableBinding.state = STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
            self.playerBuildableBinding.state = STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
            self.playerBuildableBinding.state = STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING;
            self.showProgressBar();
            break;
          default:
            break;
        }
      },
    },
  },

  updateCriticalProperties(newState, newFixedSpriteCentreContinuousPos, newLevel, newBuildingOrUpgradingStartedAt) {
    const self = this;
    const anythingChanged = (
      (newState != self.state)
      ||
      (newLevel != self.currentLevel)
      ||
      (null == self.fixedSpriteCentreContinuousPos && null != newFixedSpriteCentreContinuousPos)
      ||
      (null != self.fixedSpriteCentreContinuousPos && (newFixedSpriteCentreContinuousPos.x != self.fixedSpriteCentreContinuousPos.x || newFixedSpriteCentreContinuousPos.y != self.fixedSpriteCentreContinuousPos.y))
    ); 
    self.fixedSpriteCentreContinuousPos = newFixedSpriteCentreContinuousPos;
    self.currentLevel = newLevel;
    self.playerBuildableBinding.currentLevel = newLevel;
    self.buildingOrUpgradingStartedAt = newBuildingOrUpgradingStartedAt;
    self.playerBuildableBinding.buildingOrUpgradingStartedAt = newBuildingOrUpgradingStartedAt;
    self.state = newState; // Will trigger the "setter" of "StatefulBuildableInstance.state" to update "StatefulBuildableInstance.playerBuildableBinding.state" appropriately.
    if (
      anythingChanged
      &&
      (
        self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE
     || self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING
     || self.playerBuildableBinding.state == STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING
      )
    ) {
      cc.sys.localStorage.setItem("playerBuildableBindingList", JSON.stringify(self.mapIns.statefulBuildableInstanceList));
      cc.sys.localStorage.setItem("wallet", JSON.stringify(self.mapIns.wallet));
    }
  },

  onLoad() {
    const self = this;
    self.node.on(cc.Node.EventType.POSITION_CHANGED, (evt) => {
      // Temporarily left blank, but could be useful soon. -- YFLu
    }, self);
  },

  ctor() {
    this.mapIns = null;
    this.buildingOrUpgradingStartedAt = null; // GMT+0 milliseconds. 
    this.buildingOrUpgradingDuration= null; // 建筑建造所需时间
    this._progressInstance = null; // 进度条节点
    this.activeAppearance = null;
  },

  initOrUpdateFromPlayerBuildableBinding(playerBuildableBinding, statelessBuildableInstance, mapIns) {
    const self = this;
    if (null == self.node) {
      cc.warn("StatefulBuildableInstance.initAfterInstantiated: Please instantiate the node first!");
      return;
    }
    self.mapIns = mapIns;
    self.currentLevel = playerBuildableBinding.currentLevel;
    self.buildingOrUpgradingStartedAt = playerBuildableBinding.buildingOrUpgradingStartedAt;
    self.playerBuildableBinding = playerBuildableBinding;
    self.initFromStatelessBuildableBinding(statelessBuildableInstance, mapIns);
    switch (playerBuildableBinding.state) {
  // Temporarily hardcoded. -- YFLu     case window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE: 
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING: 
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING: 
        self.state = playerBuildableBinding.state; // This assignment might trigger `self.showProgressBar()`, thus should be put AFTER `self.initFromStatelessBuildableBinding(...)` within which `self.buildingOrUpgradingDuration` is initialized. -- YFLu 
        break;
      default:
        console.warn("Invalid persistent storage `playerBuildableBinding.state` found for: ", playerBuildableBinding);
        break;
    }

    const anchorTileContinuousPos = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapIns.node, self.mapIns.tiledMapIns, null, playerBuildableBinding.topmostTileDiscretePositionX, playerBuildableBinding.topmostTileDiscretePositionY);

    self.fixedSpriteCentreContinuousPos = anchorTileContinuousPos.sub(self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset); 

    self._refreshAppearanceResource();
  },

  initFromStatelessBuildableBinding(singleStatelessBuildableInstance, mapIns, specifiedState) {
    const self = this;
    if (null == self.node) {
      cc.warn("StatefulBuildableInstance.initAfterInstantiated: Please instantiate the node first!");
      return;
    }
    self.mapIns = mapIns;
    self.currentLevel = (self.currentLevel ? self.currentLevel : INITIAL_STATEFUL_BUILDABLE_LEVEL);
    self.displayName = singleStatelessBuildableInstance.displayName;
    self.discreteWidth = singleStatelessBuildableInstance.discreteWidth; // Not used yet.
    self.discreteHeight = singleStatelessBuildableInstance.discreteHeight; // Not used yet.
    self.boundingBoxContinuousWidth = singleStatelessBuildableInstance.boundingBoxContinuousWidth;
    self.boundingBoxContinuousHeight = singleStatelessBuildableInstance.boundingBoxContinuousHeight;
    self.topmostAnchorTileCentreWrtBoundingBoxCentre = singleStatelessBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre;
    self.spriteCentreTileToAnchorTileDiscreteOffset = singleStatelessBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset;
    self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset = singleStatelessBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset;
    self.boundaryPoints = singleStatelessBuildableInstance.boundaryPoints;
    // 记录等级配置
    self.levelConfs = singleStatelessBuildableInstance.levelConfs;
    // 记录建筑升级所需时间
    self.buildingOrUpgradingDuration = singleStatelessBuildableInstance.buildingOrUpgradingDuration;
    // 记录appearance
    self.appearance = singleStatelessBuildableInstance.appearance;
    
    /*
    * You shouldn't assign anything to `self._fixedSpriteCentreContinuousPos` at the moment, because upon creation from `statelessBuildableInstance` the corresponding `statefulBuildableInstance` has NO FIXED SpriteCentre!
    */
    let curTimeMills = Date.now();
    if (null != self.playerBuildableBinding) {
      // Already initialized or updated within `self.initOrUpdateFromPlayerBuildableBinding(...)`, should NOT invoke `self._refreshAppearanceResource()`.
      return;
    }
    self.playerBuildableBinding = {
      id: 0, // Hardcoded temporarily to comply with ProtobufStruct, and might NOT be necessary. -- YFLu
      topmostTileDiscretePositionX: null,
      topmostTileDiscretePositionY: null,
      playerId: -1, // Hardcoded temporarily. -- YFLu
      buildable: {
        id: singleStatelessBuildableInstance.id,
        type: singleStatelessBuildableInstance.type,
        discreteWidth: singleStatelessBuildableInstance.discreteWidth,
        discreteHeight: singleStatelessBuildableInstance.discreteHeight,
        displayName: singleStatelessBuildableInstance.displayName,
      },
      currentLevel: (self.currentLevel ? self.currentLevel : INITIAL_STATEFUL_BUILDABLE_LEVEL),
      state: (null == self._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING : self._state),
      createdAt: curTimeMills,
      updatedAt: curTimeMills,
      buildingOrUpgradingStartedAt: null,
    };
    self._refreshAppearanceResource();
  },

  showProgressBar() {
    const self = this;
    if (null != self._progressInstance && self._progressInstance.node.active) {
      return;
    }
    let totalSeconds = null;
    if (null != self.buildingOrUpgradingDuration && (self.isUpgrading() || self.isBuilding())) {
      totalSeconds = self.buildingOrUpgradingDuration[self.currentLevel + 1];
    }
    if (null != totalSeconds && null != self.buildingOrUpgradingStartedAt) {
      let cpn = self._progressInstance || createProgressInstance();
      self._progressInstance = cpn;
      self._progressInstance.node.active = true;
      cpn.setData(self.buildingOrUpgradingStartedAt, totalSeconds * 1000 /* milliseconds */);
    } else {
      console.warn("Invalid values of `totalSeconds`, `self.buildingOrUpgradingStartedAt` found when calling `showProgressBar`",
        self.buildingOrUpgradingDuration,
        totalSeconds,
        self.buildingOrUpgradingStartedAt
      );
    }

    function createProgressInstance() {
      let node = cc.instantiate(self.mapIns.buildOrUpgradeProgressBarPrefab);
      let cpn = node.getComponent("BuildOrUpgradeProgressBar");
      node.setPosition(cc.v2(0, self.node.height / 2 + 10));
      cpn.onCompleted = function() {
        let targetState = null;
        self._progressInstance.node.active = false;
        switch (self.state) {
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
            targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
            targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
            targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL;
            break;
          default:
            cc.warn("unknown state founded when buildingOrUpgrade operation done: ", self.state);
            break;
        }
        const newLevel = (self.currentLevel + 1);
        self.updateCriticalProperties(targetState, self.fixedSpriteCentreContinuousPos, newLevel, null);
        self._refreshAppearanceResource();
        // 更新InfoPanel的data
        let statefulInstanceInfoPanelNode = self.node.statefulInstanceInfoPanelNode;
        let statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent("StatefulBuildableInstanceInfoPanel");
        statefulInstanceInfoPanelScriptIns.refreshData();
      }
      // 修改: 将progressbar作为node的子元素而不是mapIns的子元素
      safelyAddChild(self.node, node);
      return cpn;
    }
  },

  isUpgradable() {
    const self = this;
    let nextLevel = self.currentLevel + 1;
    return !!self.levelConfs.find((levelConf) => levelConf.level == nextLevel);
  },

  isNewing() {
    const self = this;
    return [STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW].includes(self.state);
  },

  isBuilding() {
    const self = this;
    return (-1 != [STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING].indexOf(self.state));
  },

  isUpgrading() {
    const self = this;
    return (-1 != [STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING].indexOf(self.state));
  },

  upgradeUnconditionally() {
    const self = this;
    let targetState;
    switch (self.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING;
        break;
      default:
        cc.warn(`ircorrect state when upgrade: ${self.state}`);
        return;
    }

    self.updateCriticalProperties(targetState, self.fixedSpriteCentreContinuousPos, self.currentLevel, Date.now());
    self.initUpgradingAnimation();
    self.showProgressBar();
  },

  _refreshAppearanceResource() {
    const self = this;
    const shouldPlaySpriteFrame = true; // Hardcoded temporarily. -- YFLu
    const shouldPlayAnimClip = false; // Hardcoded temporarily. -- YFLu
    if (shouldPlaySpriteFrame) {
      if (null == self.appearance) {
        console.warn("Appearance resource for StatefulBuildableInstance not found for: ", "self.appearance: ", self.appearance);
        return;
      }
      const effectiveLevelToFindSpriteFrame = ((self.isNewing() || self.isBuilding()) ? (1 + INITIAL_STATEFUL_BUILDABLE_LEVEL) : self.currentLevel);
      self.activeAppearance = self.appearance[effectiveLevelToFindSpriteFrame];
      if (null == self.activeAppearance) {
        console.warn("Appearance resource for StatefulBuildableInstance not found for: ", "self.appearance: ", self.appearance, "effectiveLevelToFindSpriteFrame: ", effectiveLevelToFindSpriteFrame);
        return;
      }
      self.node.getComponent(cc.Sprite).spriteFrame = self.activeAppearance;
    } else {
      // TODO 
    }
  },

  initUpgradingAnimation() {
    const self = this;
    self._refreshAppearanceResource();
  },

});

module.export = StatefulBuildableInstance;
