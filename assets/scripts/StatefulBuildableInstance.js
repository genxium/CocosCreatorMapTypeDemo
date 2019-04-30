const StatelessBuildableInstance = require("./StatelessBuildableInstance");

window.STATEFUL_BUILDABLE_INSTANCE_STATE = {
  IDLE: 1, 
  BUILDING: 2,
  EDITING: 3,
  EDITING_WHILE_BUILDING_OR_UPGRADING: 4
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
            this.editBuildButton.node.width = this.node.width;
            this.editBuildButton.node.height = this.node.height;
            this.editBuildButton.interactable = true;
            this.playerBuildableBinding.state = val;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
            //使建筑能响应点击事件
            this.editBuildButton.node.width = this.node.width;
            this.editBuildButton.node.height = this.node.height;
            this.editBuildButton.interactable = true;
            this.playerBuildableBinding.state = val;
            // 状态变更为建造中时显示ProgressBar
            if (!this.buildingOrUpgradingStartedAt) {
              // 初始建造时该属性为null
              this.buildingOrUpgradingStartedAt = Date.now();
            }
            setTimeout(() => {  
              self.showProgressBar();
            });
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
            //以防止editBuildButton”遮盖“了touchEventManger的控制。
            this.editBuildButton.node.width = 0;
            this.editBuildButton.node.height = 0;
            this.editBuildButton.interactable = false;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING_OR_UPGRADING:
            //以防止editBuildButton”遮盖“了touchEventManger的控制。
            this.editBuildButton.node.width = 0;
            this.editBuildButton.node.height = 0;
            this.editBuildButton.interactable = false;
            setTimeout(() => {  
              self.showProgressBar();
            });
            break;
          default:
            this.editBuildButton.node.width = 0;
            this.editBuildButton.node.height = 0;
            this.editBuildButton.interactable = false;
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
      (newFixedSpriteCentreContinuousPos.x != self.fixedSpriteCentreContinuousPos.x || ewFixedSpriteCentreContinuousPos.y != self.fixedSpriteCentreContinuousPos.y)
    ); 
    self.state = newState; 
    self.fixedSpriteCentreContinuousPos = newFixedSpriteCentreContinuousPos;
    if (
      anythingChanged
      &&
      (newState == STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE || newState == STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING)
    ) {
      cc.sys.localStorage.setItem("playerBuildableBindingList", JSON.stringify(self.mapIns.statefulBuildableInstanceList));
      self.mapIns.sendPlayerSyncDataUpsync();
    }
  },

  onLoad() {
    const self = this;
    // Initialization of the `editBuildButton` [begins].
    const editBuildBtnHandler = new cc.Component.EventHandler();
    editBuildBtnHandler.target = this.mapIns.node;
    editBuildBtnHandler.component = this.mapIns.node.name;
    editBuildBtnHandler.handler = "onStatefulBuildableBuildingEditButtonClicked";
    editBuildBtnHandler.customEventData = self;
    self.editBuildButton.clickEvents = [
      editBuildBtnHandler
    ];
    // Initialization of the `editBuildButton` [ends].

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
    self.estimatedSpriteCentreToAnchorTileCentreContinuousOffset = singleStatelessBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset;
    self.boundaryPoints = singleStatelessBuildableInstance.boundaryPoints;

    // 记录建筑升级所需时间
    self.buildingOrUpgradingDuration = singleStatelessBuildableInstance.buildingOrUpgradingDuration;

    if (singleStatelessBuildableInstance.appearance) {
      self.activeAppearance = singleStatelessBuildableInstance.appearance[self.currentLevel];
      self.node.getComponent(cc.Sprite).spriteFrame = self.activeAppearance;
    }
    
    /*
    * You shouldn't assign anything to `self._fixedSpriteCentreContinuousPos` at the moment, because upon creation from `statelessBuildableInstance` the corresponding `statefulBuildableInstance` has NO FIXED SpriteCentre!
    */

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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      //若statefulBuilding时从localStorage读取创建的,则buildingOrUpgradingStartedAt保持为上次记录时间
      buildingOrUpgradingStartedAt: self.buildingOrUpgradingStartedAt || Date.now(),
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
      let pi = self._progressInstance || createProgressInstance(),
          cpn = pi.getComponent("BuildOrUpgradeProgressBar");
      self._progressInstance = pi;
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
      cpn.onCompleted = function() {
        self.node.removeChild(self._progressInstance);
        self._progressInstance = null;
        // 若建筑在移动中完成建造,则将其状态变更为EDINGTING
        switch (self.state) {
          case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
            self.state = STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE;
            break;
          case STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING_OR_UPGRADING:
            self.state = STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING;
          default:
            cc.warn("unknown state founded when buildingOrUpgrade operation done: ", self.state);
            break;
        }
      }
      cpn.onProgressUpdate = function name(progress, remainMillionSeconds) {
        node.setPosition(cc.v2(0, self.node.height / 2 + 10));
        // node.setPosition(cc.v2(0, Math.floor(Math.random() * 50)));
      }
      // 修改: 将progressbar作为node的子元素而不是mapIns的子元素
      safelyAddChild(self.node, node);
      return node;
    }
  }
});

module.export = StatefulBuildableInstance;
