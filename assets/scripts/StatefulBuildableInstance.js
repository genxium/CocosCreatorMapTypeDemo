const StatelessBuildableInstance = require("./StatelessBuildableInstance");

window.STATEFUL_BUILDABLE_INSTANCE_STATE = {
  IDLE: 1, 
  BUILDING: 2,
  UPGRADING: 3,
  EDITING: 4,
  EDITING_WHILE_BUILDING_OR_UPGRADING: 5,
  EDITING_PANEL: 6,
  EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING: 7,
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
        return (null == this._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING : this._state);
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
            this.playerBuildableBinding.state = val;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
            this.playerBuildableBinding.state = val;
            // 状态变更为建造中或升级中时显示ProgressBar
            if (!this.buildingOrUpgradingStartedAt) {
              // 初始建造时该属性为null
              this.buildingOrUpgradingStartedAt = this.playerBuildableBinding.buildingOrUpgradingStartedAt = Date.now();
            }
            self.showProgressBar();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
            this.playerBuildableBinding.state = val;
            self.initUpgradingAnimation();
            self.showProgressBar();
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING_OR_UPGRADING:
            setTimeout(() => {
              self.showProgressBar();
            });
            break;
          default:
            break;
        }
      },
    },
  },

  updateCriticalProperties(newState, newFixedSpriteCentreContinuousPos) {
    const self = this;
    const anythingChanged = (
      (newState != self.state)
      ||
      (null == self.fixedSpriteCentreContinuousPos && null != newFixedSpriteCentreContinuousPos)
      ||
      (null != self.fixedSpriteCentreContinuousPos && (newFixedSpriteCentreContinuousPos.x != self.fixedSpriteCentreContinuousPos.x || newFixedSpriteCentreContinuousPos.y != self.fixedSpriteCentreContinuousPos.y))
    ); 
    self.state = newState; 
    self.fixedSpriteCentreContinuousPos = newFixedSpriteCentreContinuousPos;
    if (
      anythingChanged
      &&
      (
        newState == STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE
     || newState == STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING
     || newState == STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING
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
    // this.buildingOrUpgradingDuration = null;
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
    self.initFromStatelessBuildableBinding(statelessBuildableInstance, mapIns);
    self.playerBuildableBinding = playerBuildableBinding;

    const anchorTileContinuousPos = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapIns.node, self.mapIns.tiledMapIns, null, playerBuildableBinding.topmostTileDiscretePositionX, playerBuildableBinding.topmostTileDiscretePositionY);

    self.fixedSpriteCentreContinuousPos = anchorTileContinuousPos.sub(self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset); 

    self.state = playerBuildableBinding.state;
  },

  initFromStatelessBuildableBinding(singleStatelessBuildableInstance, mapIns, specifiedState) {
    const self = this;
    if (null == self.node) {
      cc.warn("StatefulBuildableInstance.initAfterInstantiated: Please instantiate the node first!");
      return;
    }
    self.mapIns = mapIns;
    self.currentLevel = (self.currentLevel ? self.currentLevel : 1);
    self.displayName = singleStatelessBuildableInstance.displayName;
    self.discreteWidth = singleStatelessBuildableInstance.discreteWidth; // Not used yet.
    self.discreteHeight = singleStatelessBuildableInstance.discreteHeight; // Not used yet.
    self.boundingBoxContinuousWidth = singleStatelessBuildableInstance.boundingBoxContinuousWidth;
    self.boundingBoxContinuousHeight = singleStatelessBuildableInstance.boundingBoxContinuousHeight;
    self.topmostAnchorTileCentreWrtBoundingBoxCentre = singleStatelessBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre;
    self.spriteCentreTileToAnchorTileDiscreteOffset = singleStatelessBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset;
    self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset = singleStatelessBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset;
    self.boundaryPoints = singleStatelessBuildableInstance.boundaryPoints;

    // 记录建筑升级所需时间
    self.buildingOrUpgradingDuration = singleStatelessBuildableInstance.buildingOrUpgradingDuration;
    // 记录appearance
    self.appearance = singleStatelessBuildableInstance.appearance;
    self.refreshAppearance();
    
    /*
    * You shouldn't assign anything to `self._fixedSpriteCentreContinuousPos` at the moment, because upon creation from `statelessBuildableInstance` the corresponding `statefulBuildableInstance` has NO FIXED SpriteCentre!
    */
    let curTimeMills = Date.now();
    self.playerBuildableBinding = {
      id: 0, //WARNING: proto字段，但是目前前端逻辑不需要
      topmostTileDiscretePositionX: null,
      topmostTileDiscretePositionY: null,
      playerId: -1, 
      buildable: {
        id: singleStatelessBuildableInstance.id,
        type: singleStatelessBuildableInstance.type,
        discreteWidth: singleStatelessBuildableInstance.discreteWidth,
        discreteHeight: singleStatelessBuildableInstance.discreteHeight,
        displayName: singleStatelessBuildableInstance.displayName,
      },
      currentLevel: (self.currentLevel ? self.currentLevel : 1),
      state: (null == self._state ? STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING : self._state),
      createdAt: curTimeMills,
      updatedAt: curTimeMills,
      buildingOrUpgradingStartedAt: null,
    };
  },

  showProgressBar() {
    const self = this;
    if (self._progressInstance) {
      // 若进度条已显示,则不进行任何操作.
      return;
    }

    let totalSeconds = self.buildingOrUpgradingDuration && self.buildingOrUpgradingDuration[self.currentLevel];
    if (undefined != totalSeconds && self.buildingOrUpgradingStartedAt) {
      let cpn = self._progressInstance || createProgressInstance();
      self._progressInstance = cpn;
      cpn.setData(self.buildingOrUpgradingStartedAt, totalSeconds * 1000 /* 此处需要时毫秒 */);
    } else {
      cc.warn("require not falsy value: self.buildingOrUpgradingDuration, self.buildingOrUpgradingDuration[self.currentLevel], self.buildingOrUpgradingStartedAt",
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
        // 建造或升级完成时会把ProgressBar移除.
        self.node.removeChild(self._progressInstance);
        self._progressInstance = null;
        // 若建筑在移动中完成建造,则将其状态变更为EDITING
        switch (self.state) {
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
          case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
            self.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, self.fixedSpriteCentreContinuousPos);
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING_OR_UPGRADING:
            // This case is entered when for example, building or upgrading is completed while we're moving the StatefulBuildableInstance on map.
            self.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, self.fixedSpriteCentreContinuousPos);
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING:
            // This case is entered when for example, building or upgrading is completed while we're viewing info panel of the StatefulBuildableInstance.
            self.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL, self.fixedSpriteCentreContinuousPos);
            break;
          default:
            cc.warn("unknown state founded when buildingOrUpgrade operation done: ", self.state);
            break;
        }
        self.refreshAppearance();
      }
      // 修改: 将progressbar作为node的子元素而不是mapIns的子元素
      safelyAddChild(self.node, node);
      return cpn;
    }
  },
  // Warning: upgrade内部不检查约束条件
  upgrade() {
    const self = this;
    let targetState;
    switch (self.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING_OR_UPGRADING;
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
        targetState = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUIDLING_OR_UPGRADING;
        break;
      default:
        cc.warn(`ircorrect state when upgrade: ${self.state}`);
        return;
    }

    let cur = Date.now();
    self.playerBuildableBinding.prevPlayerBuildableBinding = {
      currentLevel: self.currentLevel,
      buildingOrUpgradingStartedAt: self.buildingOrUpgradingStartedAt,
    };
    self.currentLevel = self.playerBuildableBinding.currentLevel = self.currentLevel + 1;
    self.updatedAt = self.playerBuildableBinding.updatedAt = cur;
    self.buildingOrUpgradingStartedAt = self.playerBuildableBinding.buildingOrUpgradingStartedAt = cur;
    if (targetState != STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING) {
      // 数据持久化
      self.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, self.fixedSpriteCentreContinuousPos);
    }
    self.updateCriticalProperties(targetState, self.fixedSpriteCentreContinuousPos);
    self.initUpgradingAnimation();
    self.showProgressBar();
  },

  refreshAppearance() {
    const self = this;
    if (self.appearance) {
      self.activeAppearance = self.appearance[self.currentLevel];
      if (!self.activeAppearance) {
        cc.warn(`loss activeAppearance`, self.appearance, self.currentLevel);
      }
      self.node.getComponent(cc.Sprite).spriteFrame = self.activeAppearance;
    }
  },

  initUpgradingAnimation() {
    const self = this;
    //TODO: 升级动画
    self.refreshAppearance();
  },

});

module.export = StatefulBuildableInstance;
