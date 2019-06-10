const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');
const StatelessBuildableInstance = require('./StatelessBuildableInstance');
const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

window.ANIM_TYPE = {
  UPGRADING: 1,
  FINISHED: 2,
  NORMAL: 3,
};

cc.Class({
  extends: NarrativeSceneManagerDelegate,

  properties: {
    statelessBuildableInstanceCardPrefab: {
      type: cc.Prefab,
      default: null,
    },
    statefulBuildableInstancePrefab: {
      type: cc.Prefab,
      default: null,
    },
    buildOrUpgradeProgressBarPrefab: {
      type: cc.Prefab,
      default: null
    },
    cameraAutoMove: true,
  },

  ctor() {
    this.ctrl = null;
    this.statelessBuildableInstanceCardListNode = null;
    this.homingNpcScriptInsDict = {}; // Used at least for refreshing the whole collection of `HomingNpc`s.
    this.statefulBuildableFollowingNpcScriptInsDict = {}; // Used at least for refreshing the whole collection of `StatefulBuildableFollowingNpc`s.
  },

  // LIFE-CYCLE CALLBACKS:
  onDestroy() {
    clearInterval(this.inputControlTimer)
  },

  onLoad() {
    NarrativeSceneManagerDelegate.prototype.onLoad.call(this);
    const self = this;
    window.mapIns = self;
    const mapNode = self.node;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    /*
    * The nomenclature is a little tricky here for two very similar concepts "playerBuildableBinding" and "statefulBuildableInstance".
    * - When talking about frontend in-RAM instances for rendering, we use mostly "statefulBuildableInstance"
    * - When talking about "localStorage" or "remote MySQLServer" stored, to be recovered data, we use mostly "playerBuildableBinding".
    */
    self.statefulBuildableInstanceList = [];
    self.statefulBuildableInstanceCompList = [];
    window.handleNetworkDisconnected = () => {
      //TODO
    };
    const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
    tileCollisionManager.initMapNodeByTiledBoundaries(self, mapNode, boundaryObjs);

    self.tiledMapIns = mapNode.getComponent(cc.TiledMap);
    self.highlighterLayer = self.tiledMapIns.getLayer("StatefulBuildableInstanceHighlighter");
    setLocalZOrder(self.highlighterLayer.node, window.CORE_LAYER_Z_INDEX.STATEFUL_BUILDABLE_INSTANCE_HIGHLIGHTER_LAYER);

    self.startedAtMillis = Date.now();
    self.setupInputControls();

    cc.loader.loadResDir(constants.STATELESS_BUILDABLE_RESOURCE_PATH.ROOT_PATH, cc.SpriteAtlas, function(err, altasArray) {
      self.widgetsAboveAllScriptIns.buildButton.node.active = true;
      if (err) {
        cc.error(err);
        return;
      }
      self.statelessBuildableInstanceSpriteAltasArray = altasArray;
      self.sendGlobalBuildableLevelConfQuery();
    });
  },


  update(dt) {},

  setupInputControls() {
    const instance = this;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    instance.ctrl = instance.widgetsAboveAllScriptIns.touchEventManagerScriptIns;
  },

  createPerStatefulBuildableInstanceNodes(playerBuildableBinding, targetedStatelessBuildableInstance) {
    /**
    * This function is assumed to be called at least once before
    *
    * - "StatefulBuildableInstance.initFromStatelessBuildableBinding(...)", or
    * - "StatefulBuildableInstance.initOrUpdateFromPlayerBuildableBinding(...)", 
    * 
    * because the only way we can have a heap-RAM "statefulBuildableInstance" is 
    * by creating a "statefulBuildableInstanceNode" from "statefulBuildableInstancePrefab",
    * then invoke `statefulBuildableInstance = statefulBuildableInstanceNode.getComponent("StatefulBuildableInstance")`. 
    *
    * Therefore after this returns, you have simultaneously a new "statefulBuildableInstanceNode" as well as a new "statefulBuildableInstance".
    */
    const self = this;
    const statefulBuildableInstanceNode = cc.instantiate(self.statefulBuildableInstancePrefab);
    const statefulBuildableInstance = statefulBuildableInstanceNode.getComponent("StatefulBuildableInstance");
    if (null == playerBuildableBinding) {
      statefulBuildableInstance.initFromStatelessBuildableBinding(targetedStatelessBuildableInstance, self);
      statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, null /* The field `buildingOrUpgradingStartedAt` will be set within `endPositioningStatefulBuildableInstance`. */ );
    } else {
      statefulBuildableInstance.initOrUpdateFromPlayerBuildableBinding(playerBuildableBinding, targetedStatelessBuildableInstance, self);
    }

    // Initialize "statefulInstanceInfoPanelNode" [begins] 
    let statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    if (null == statefulInstanceInfoPanelNode) {
      statefulInstanceInfoPanelNode = cc.instantiate(self.statefulBuildableInstanceInfoPanelPrefab);
      statefulInstanceInfoPanelNode.setPosition(cc.v2(0, 0));
      statefulBuildableInstanceNode.statefulInstanceInfoPanelNode = statefulInstanceInfoPanelNode;
    }

    const statefulInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent("StatefulBuildableInstanceInfoPanel");
    statefulInfoPanelScriptIns.setInfo(statefulBuildableInstance);
    statefulInfoPanelScriptIns.onCloseDelegate = () => {
      self.removeShowingModalPopup();
      switch (statefulBuildableInstance.state) {
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW:
          self.addPositioningNewStatefulBuildableInstance();
          statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL:
          self.addEditingExistingStatefulBuildableInstance();
          statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING:
          self.addEditingExistingStatefulBuildableInstance();
          statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING:
          self.addEditingExistingStatefulBuildableInstance();
          statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        default:
          cc.warn("Show statefulBuildableInstancePanelNode not in editing state.")
          break;
      }
      self.statelefulBuildableController.active = true;
    };

    // Initialize "statefulInstanceInfoPanelNode" [ends] 
    return statefulBuildableInstance;
  },

  renderPerStatefulBuildableInstanceNode(statefulBuildableInstance) {
    const self = this;
    const mapIns = self;
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    if (null == statefulBuildableInstance.fixedSpriteCentreContinuousPos) {
      const mainCameraContinuousPos = self.ctrl.mainCameraNode.position; // With respect to CanvasNode.
      // Guoyl6: mainCameraNode 和 camMapNode 的坐标比例是 1 : 1,所以这里不用考虑缩放
      const roughSpriteCentreInitialContinuousPosWrtMapNode = cc.v2(mainCameraContinuousPos.x, mainCameraContinuousPos.y);
      let initialSpriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, roughSpriteCentreInitialContinuousPosWrtMapNode, cc.v2(0, 0));
      initialSpriteCentreDiscretePosWrtMapNode = cc.v2(initialSpriteCentreDiscretePosWrtMapNode);
      let initialAnchorTileDiscretePosWrtMapNode = initialSpriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      initialAnchorTileDiscretePosWrtMapNode = self.correctDiscretePositionToWithinMap(statefulBuildableInstance, initialAnchorTileDiscretePosWrtMapNode);
      initialSpriteCentreDiscretePosWrtMapNode = initialAnchorTileDiscretePosWrtMapNode.add(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      const initialSpriteCentreContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapIns.node, mapIns.tiledMapIns, null, initialSpriteCentreDiscretePosWrtMapNode.x, initialSpriteCentreDiscretePosWrtMapNode.y);
      statefulBuildableInstanceNode.setPosition(initialSpriteCentreContinuousPosWrtMapNode);
    } else {
      statefulBuildableInstanceNode.setPosition(statefulBuildableInstance.fixedSpriteCentreContinuousPos);
    }


    safelyAddChild(self.node, statefulBuildableInstanceNode); // Using `statefulBuildableInstanceNode` as a direct child under `mapNode`, but NOT UNDER `mainCameraNode`, for the convenience of zooming and translating.

    // 使statefulBuildableInstanceNode.zIndex具有一个初始值
    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);

  },

  startPositioningExistingStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const mapIns = self;
    const tiledMapIns = mapIns.tiledMapIns;
    mapIns.statelefulBuildableController.active = true;
    mapIns.buildButton.node.active = false;
    if (false == self.addEditingExistingStatefulBuildableInstance()) return;

    let statefulBuildableInstanceNode = statefulBuildableInstance.node;
    if (null == statefulBuildableInstanceNode) {
      cc.warn("There is no `statefulBuildableInstanceNode` when trying to position exiting statefulBuildableInstance.");
      return;
    }

    switch (statefulBuildableInstance.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      default:
        break;
    }

    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);

    self.editingStatefulBuildableInstance = statefulBuildableInstance;
    self.refreshHighlightedTileGridForEditingStatefulBuildableInstance(self.tiledMapIns);
  },

  startPositioningNewStatefulBuildableInstance(statelessBuildableInstance) {
    const self = this;
    const mapIns = self;
    const tiledMapIns = mapIns.tiledMapIns;
    mapIns.statelefulBuildableController.active = true;
    mapIns.buildButton.node.active = false;
    if (false == self.addPositioningNewStatefulBuildableInstance()) return;

    const statefulBuildableInstance = self.createPerStatefulBuildableInstanceNodes(null, statelessBuildableInstance);
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    self.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
    /*
     * WARNING: 这里的setLocalZOrder应该在renderPerStatefulBuildableInstanceNode
     * 之后进行,因为renderPerStatefulBuildableInstanceNode中也有设置zIndex的操作.
     */
    // 
    setLocalZOrder(statefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);

    self.editingStatefulBuildableInstance = statefulBuildableInstance;
    self.refreshHighlightedTileGridForEditingStatefulBuildableInstance(self.tiledMapIns);
  },

  endPositioningStatefulBuildableInstance(successfullyPlacedOrNot) {
    const self = this;
    const mapIns = self;
    const mapNode = self.node;
    self.statelefulBuildableController.active = false;
    self.buildButton.node.active = true;
    let statefulBuildableInstanceList = self.statefulBuildableInstanceList;
    const editingStatefulBuildableInstance = self.editingStatefulBuildableInstance;
    self.cancelHighlightingStatefulBuildableInstance(self.tiledMapIns);

    const editingStatefulBuildableInstanceNode = editingStatefulBuildableInstance.node;
    if (null == editingStatefulBuildableInstance || null == editingStatefulBuildableInstanceNode.parent) {
      console.warn("Invalid `editingStatefulBuildableInstance` and `editingStatefulBuildableInstanceNode` found within `endPositioningStatefulBuildableInstance`: ", editingStatefulBuildableInstance, editingStatefulBuildableInstanceNode);
      return;
    }
    setLocalZOrder(editingStatefulBuildableInstanceNode, window.CORE_LAYER_Z_INDEX.UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE);
    if (false == successfullyPlacedOrNot) {
      switch (editingStatefulBuildableInstance.state) {
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
          self.removePositioningNewStatefulBuildableInstance();
          editingStatefulBuildableInstanceNode.parent.removeChild(editingStatefulBuildableInstanceNode);
          self.editingStatefulBuildableInstance = null;
          self.onBuildButtonClicked(); // 重新打开`StatelessBuildableInstanceCardListNode`
          return; // Note that it's returning instead breaking here -- YFLu.
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        default:
          console.warn("Invalid `StatefulBuildableInstance.state` when positioning is cancelled: ", editingStatefulBuildableInstance);
          break;
      }

      editingStatefulBuildableInstanceNode.setPosition(editingStatefulBuildableInstance.fixedSpriteCentreContinuousPos);
      self.createBoundaryColliderForStatefulBuildableInsatnce(editingStatefulBuildableInstance, self.tiledMapIns);
    } else {
      let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.node, self.tiledMapIns, editingStatefulBuildableInstanceNode.position, cc.v2(0, 0));
      spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
      if (self.isStatefulBuildableOutOfMap(editingStatefulBuildableInstance, spriteCentreDiscretePosWrtMapNode)) {
        console.warn("The positioned `StatefulBuildableInstance` is out of map: ", editingStatefulBuildableInstance);
        return;
      }

      switch (editingStatefulBuildableInstance.state) {
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
          self.removePositioningNewStatefulBuildableInstance();
          self.statefulBuildableInstanceList.push(editingStatefulBuildableInstance.playerBuildableBinding);
          self.statefulBuildableInstanceCompList.push(editingStatefulBuildableInstance);
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, editingStatefulBuildableInstanceNode.position, editingStatefulBuildableInstance.currentLevel, Date.now());
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE, editingStatefulBuildableInstanceNode.position, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING, editingStatefulBuildableInstanceNode.position, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
          self.removeEditingExistingStatefulBuildableInstance();
          editingStatefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING, editingStatefulBuildableInstanceNode.position, editingStatefulBuildableInstance.currentLevel, editingStatefulBuildableInstance.buildingOrUpgradingStartedAt);
          break;
        default:
          console.warn("Invalid `StatefulBuildableInstance.state` when positioning is confirmed: ", editingStatefulBuildableInstance);
          break;
      }

      self.createBoundaryColliderForStatefulBuildableInsatnce(editingStatefulBuildableInstance, self.tiledMapIns);
      self.renderPerStatefulBuildableInstanceNode(editingStatefulBuildableInstance);
    }
    self.editingStatefulBuildableInstance = null;
  },

  clearTheBoundaryColliderInfoForStatefulBuildableInstance(statefulBuildableInstance, tiledMapIns) {
    const self = this;
    const mapScriptIns = self;
    if (statefulBuildableInstance.barrierColliderIns) {
      const barrierCollidersInMap = mapScriptIns.barrierColliders;
      for (let i in barrierCollidersInMap) {
        const theBarrierColliderIns = barrierCollidersInMap[i];
        if (theBarrierColliderIns.uuid == statefulBuildableInstance.barrierColliderIns.uuid) {
          barrierCollidersInMap.splice(i, 1);
          const barrierColliderNode = statefulBuildableInstance.barrierColliderNode;
          if (barrierColliderNode && barrierColliderNode.parent) {
            barrierColliderNode.parent.removeChild(barrierColliderNode);
          }
          window.refreshCachedKnownBarrierGridDict(mapScriptIns.node, mapScriptIns.barrierColliders, null);
          break;
        }
      }
    }
  },

  createBoundaryColliderForStatefulBuildableInsatnce(statefulBuildableInstance, tiledMapIns) {
    /*
    * Be very careful using this function, it should only be called
    * - when a new `statefulBuildableInstance` is created from a new `playerBuildableBinding` record from either `localStorage` or `remote MySQLServer`, or
    * - when `endPositioningStatefulBuildableInstance`.
    */
    if (null == statefulBuildableInstance.fixedSpriteCentreContinuousPos) {
      cc.warn("Invoking `createBoundaryColliderForStatefulBuildableInsatnce` when `null == statefulBuildableInstance.fixedSpriteCentreContinuousPos`.");
      return;
    }
    const self = this;
    const mapScriptIns = self;
    const halfBarrierAnchorToBoundingBoxCentre = cc.v2(statefulBuildableInstance.boundingBoxContinuousWidth, statefulBuildableInstance.boundingBoxContinuousHeight).mul(0.5);
    const newBarrier = cc.instantiate(mapScriptIns.polygonBoundaryBarrierPrefab);
    newBarrier.width = statefulBuildableInstance.boundingBoxContinuousWidth;
    newBarrier.height = statefulBuildableInstance.boundingBoxContinuousHeight;
    newBarrier.setAnchorPoint(cc.v2(0, 0));

    const anchorTileContinuousPos = statefulBuildableInstance.fixedSpriteCentreContinuousPos.add(statefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset);
    const boundingBoxCentrePos = anchorTileContinuousPos.sub(statefulBuildableInstance.topmostAnchorTileCentreWrtBoundingBoxCentre);

    const newBarrierPos = boundingBoxCentrePos.sub(halfBarrierAnchorToBoundingBoxCentre);
    newBarrier.setPosition(newBarrierPos);

    const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
    newBarrierColliderIns.points = [];
    for (let p of statefulBuildableInstance.boundaryPoints) {
      newBarrierColliderIns.points.push(cc.v2(p).add(halfBarrierAnchorToBoundingBoxCentre));
    }
    statefulBuildableInstance.barrierColliderIns = newBarrierColliderIns;
    newBarrierColliderIns.boundStatefulBuildable = statefulBuildableInstance; 
    statefulBuildableInstance.barrierColliderNode = newBarrier;
    mapScriptIns.barrierColliders.push(newBarrierColliderIns);
    mapScriptIns.node.addChild(newBarrier);
    window.refreshCachedKnownBarrierGridDict(mapScriptIns.node, mapScriptIns.barrierColliders, null);
  },

  refreshHighlightedTileGridForEditingStatefulBuildableInstance(tiledMapIns) {
    const self = this;
    if (null == self.editingStatefulBuildableInstance) {
      cc.warn("Wrong map state detected in `refreshHighlightedTileGridForEditingStatefulBuildableInstance`!");
      return;
    }

    const discreteWidth = self.editingStatefulBuildableInstance.discreteWidth;
    const discreteHeight = self.editingStatefulBuildableInstance.discreteHeight;
    const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.node, tiledMapIns, self.editingStatefulBuildableInstance.node.position.add(self.editingStatefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));

    let currentLayerSize = self.highlighterLayer.getLayerSize();

    /**
    * The highlighted TileGrids are drawn on a "same single TileLayer" instead of by "(discreteWidth*discreteHeight) cc.Sprites of rhombuses" to save RAM usage. 
    */
    for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
      for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
        if (
          (discreteXInLayer >= anchorTileDiscretePos.x && discreteXInLayer < (anchorTileDiscretePos.x + discreteWidth))
          &&
          (discreteYInLayer >= anchorTileDiscretePos.y && discreteYInLayer < (anchorTileDiscretePos.y + discreteHeight))
        ) {
          /*
          * The magic GID `139 == 137+2` comes from the corresponding `map.tmx` at the bound tileset for layer `StatefulBuildableInstanceHighlighter`.
          * There's already a programmatic way of extracting such info in `TileCollisionManager.extractBoundaryObjects` but it's a hassle to transplant in the graceful manner. Therefore due to time limit I chose to just pull in this magic number.
          *
          * -- YFLu   
          */
          if (window.cachedKnownBarrierGridDict[discreteXInLayer] && window.cachedKnownBarrierGridDict[discreteXInLayer][discreteYInLayer]) {
            self.highlighterLayer.setTileGIDAt(4, discreteXInLayer, discreteYInLayer);
          } else {
            self.highlighterLayer.setTileGIDAt(1, discreteXInLayer, discreteYInLayer);
          }
        } else {
          self.highlighterLayer.setTileGIDAt(0, discreteXInLayer, discreteYInLayer);
        }
      }
    }
  },

  cancelHighlightingStatefulBuildableInstance(tiledMapIns) {
    const self = this;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
      for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
        self.highlighterLayer.setTileGIDAt(0, discreteXInLayer, discreteYInLayer);
      }
    }
  },

  isHighlightingStatefulBuildableInstanceInBarriers(tiledMapIns) {
    const self = this;
    let currentLayerSize = self.highlighterLayer.getLayerSize();

    const discreteWidth = self.editingStatefulBuildableInstance.discreteWidth;
    const discreteHeight = self.editingStatefulBuildableInstance.discreteHeight;
    const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.node, tiledMapIns, self.editingStatefulBuildableInstance.node.position.add(self.editingStatefulBuildableInstance.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));

    for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
      for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
        if (
          (discreteXInLayer >= anchorTileDiscretePos.x && discreteXInLayer < (anchorTileDiscretePos.x + discreteWidth))
          &&
          (discreteYInLayer >= anchorTileDiscretePos.y && discreteYInLayer < (anchorTileDiscretePos.y + discreteHeight))
        ) {
          if (window.cachedKnownBarrierGridDict[discreteXInLayer] && window.cachedKnownBarrierGridDict[discreteXInLayer][discreteYInLayer]) {
            return true;
          }
        }
      }
    }
    return false;

  },

  onMovingBuildableInstance(touchPosInCamera, immediateDiffVec, statefulBuildableInstanceAtTouchStart) {
    const self = this,
      mapIns = this;
    if (null == this.editingStatefulBuildableInstance) {
      cc.warn("Wrong map state detected in `onMovingBuildableInstance`!");
      return;
    }
    if (statefulBuildableInstanceAtTouchStart == self.editingStatefulBuildableInstance) {
      // Moving StatefulBuildableInstance
      const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position; // With respect to CanvasNode.
      const {spriteCentreTileToAnchorTileDiscreteOffset} = mapIns.editingStatefulBuildableInstance;
      const roughImmediateContinuousPosOfCameraOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosInCamera.x, touchPosInCamera.y)));
      let immediateDiscretePosOfCameraOnMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, roughImmediateContinuousPosOfCameraOnMapNode, cc.v2(0, 0));
      immediateDiscretePosOfCameraOnMapNode = cc.v2(immediateDiscretePosOfCameraOnMapNode);
      let immediateAnchorDiscretePos = immediateDiscretePosOfCameraOnMapNode.sub(spriteCentreTileToAnchorTileDiscreteOffset);
      immediateAnchorDiscretePos = mapIns.correctDiscretePositionToWithinMap(mapIns.editingStatefulBuildableInstance, immediateDiscretePosOfCameraOnMapNode);
      immediateDiscretePosOfCameraOnMapNode = immediateAnchorDiscretePos.add(spriteCentreTileToAnchorTileDiscreteOffset);
      const immediateContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapIns.node, mapIns.tiledMapIns, null, immediateDiscretePosOfCameraOnMapNode.x, immediateDiscretePosOfCameraOnMapNode.y);
      mapIns.editingStatefulBuildableInstance.node.setPosition(immediateContinuousPosWrtMapNode);
      mapIns.refreshHighlightedTileGridForEditingStatefulBuildableInstance(mapIns.tiledMapIns);
    } else {
      // Moving Camera
      const cameraPos = mapIns.ctrl.mainCameraNode.position.sub(immediateDiffVec);
      if (tileCollisionManager.cameraIsOutOfGrandBoundary(mapIns.node, cameraPos.sub(mapIns.node.position))) {
        return;
      }
      mapIns.ctrl.mainCameraNode.setPosition(cameraPos);
    }
  },

  onSingleFingerClick(touchPosInCamera) {
    const self = this,
      mapIns = this;
    let targetCpn = self.findStatefulBuildableInstanceAtPosition(touchPosInCamera);
    if (targetCpn != null) {
      let targetNode = targetCpn.node;
      mapIns.onStatefulBuildableBuildingClicked(targetNode, targetCpn);
    }
  },

  onCancelBuildButtonClicked(evt) {
    const self = this;
    self.endPositioningStatefulBuildableInstance(false);
  },

  onConfirmBuildButtonClicked(evt) {
    const self = this;
    if (self.isHighlightingStatefulBuildableInstanceInBarriers(self.tiledMapIns)) {
      cc.warn("碰到barriers了。");
      return;
    }
    self.endPositioningStatefulBuildableInstance(true);
  },

  onStatefulBuildableBuildingClicked(statefulBuildableInstanceNode, statefulBuildableInstance) {
    const self = this;
    if (!self.isPurelyVisual()
      || (
      window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE != statefulBuildableInstance.state
      && window.STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING != statefulBuildableInstance.state
      && window.STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING != statefulBuildableInstance.state
      )) {
      return;
    }

    // remove statefulBuildableInstance.oldBarrierColliders if statefulBuildableInstance.barrierColliderIns exits.
    if (statefulBuildableInstance.barrierColliderIns) {
      self.clearTheBoundaryColliderInfoForStatefulBuildableInstance(statefulBuildableInstance, self.tiledMapIns);
    }

    switch (statefulBuildableInstance.state) {
      case STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE:
        statefulBuildableInstance.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.BUILDING:
        statefulBuildableInstance.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case STATEFUL_BUILDABLE_INSTANCE_STATE.UPGRADING:
        statefulBuildableInstance.updateCriticalProperties(STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      default:
        cc.warn(`statefulInstanceNode clicked on illegal State: ${statefulBuildableInstance.state}`);
        break;
    }

    self.startPositioningExistingStatefulBuildableInstance(statefulBuildableInstance);
  },

  onBuildButtonClicked(evt) {
    const self = this;
    if (!self.isPurelyVisual() || !self.statelessBuildableInstanceList) {
      return;
    }
    self.addShowingModalPopup();
    let statelessBuildableInstanceCardListNode = self.statelessBuildableInstanceCardListNode;
    if (!statelessBuildableInstanceCardListNode) {
      statelessBuildableInstanceCardListNode = cc.instantiate(self.statelessBuildableInstanceCardListPrefab);
      statelessBuildableInstanceCardListNode.setPosition(0, -400);
      self.statelessBuildableInstanceCardListNode = statelessBuildableInstanceCardListNode;
    }
    const statelessBuildableInstanceCardListScriptIns = statelessBuildableInstanceCardListNode.getComponent("StatelessBuildableInstanceCardList");
    statelessBuildableInstanceCardListScriptIns.onCloseDelegate = () => {
      self.removeShowingModalPopup();
    };
    statelessBuildableInstanceCardListScriptIns.refreshStatelessBuildableInstanceCardListNode(self, self.statelessBuildableInstanceList, null);

    safelyAddChild(self.widgetsAboveAllNode, statelessBuildableInstanceCardListNode);
  },

  refreshStatelessBuildableInstances(allStatelessBuildableInstances, ownedStatefulBuildableInstances) {
    this.statelessBuildableInstanceList = [];
    for (let k in allStatelessBuildableInstances) {
      const singleStatelessBuildableInstance = allStatelessBuildableInstances[k];
      const statelessBuildableInstanceScriptIns = new StatelessBuildableInstance();
      for (let i in this.statelessBuildableInstanceSpriteAltasArray) {
        const theAltas = this.statelessBuildableInstanceSpriteAltasArray[i];
        if (singleStatelessBuildableInstance.displayName + ".plist" == theAltas.name) {
          statelessBuildableInstanceScriptIns.init(this, singleStatelessBuildableInstance, theAltas);
          this.statelessBuildableInstanceList.push(statelessBuildableInstanceScriptIns);
          break;
        }
      }
    }
  },

  sendGlobalBuildableLevelConfQuery(queryParam) {
    const self = this;
    // 设置全局变量以查看数值配置表
    window.AllStatelessBuildableInstances = self.AllStatelessBuildableInstances = [
      {
        "id": 1,
        "type": 1,
        "discreteWidth": 3,
        "discreteHeight": 3,
        "displayName": "Headquarter",
        "levelConfs": [
          {
            "id": 1,
            "buildable": {
              "id": 1,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Headquarter"
            },
            "level": 1,
            "buildingOrUpgradingDuration": 0,
            "buildingOrUpgradingRequiredGold": 0,
            "buildingOrUpgradingRequiredResidentsCount": 0,
            "baseFoodProductionRate": 200
          },
          {
            "id": 2,
            "buildable": {
              "id": 1,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Headquarter"
            },
            "level": 2,
            "buildingOrUpgradingDuration": 10,
            "buildingOrUpgradingRequiredGold": 2000,
            "buildingOrUpgradingRequiredResidentsCount": 10,
            "baseFoodProductionRate": 400
          },
          {
            "id": 3,
            "buildable": {
              "id": 1,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Headquarter"
            },
            "level": 3,
            "buildingOrUpgradingDuration": 20,
            "buildingOrUpgradingRequiredGold": 6000,
            "buildingOrUpgradingRequiredResidentsCount": 20,
            "baseFoodProductionRate": 600
          }
        ]
      },
      {
        "id": 2,
        "type": 1,
        "discreteWidth": 2,
        "discreteHeight": 2,
        "displayName": "Laboratory",
        "levelConfs": [
          {
            "id": 4,
            "buildable": {
              "id": 2,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Laboratory"
            },
            "level": 1,
            "buildingOrUpgradingDuration": 10,
            "buildingOrUpgradingRequiredResidentsCount": 3,
            "baseFoodProductionRate": 80
          },
        ]
      },
      {
        "id": 3,
        "type": 1,
        "discreteWidth": 2,
        "discreteHeight": 2,
        "displayName": "Restaurant",
        "levelConfs": [
          {
            "id": 7,
            "buildable": {
              "id": 3,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Restaurant"
            },
            "level": 1,
            "buildingOrUpgradingDuration": 6,
            "buildingOrUpgradingRequiredGold": 150,
            "buildingOrUpgradingRequiredResidentsCount": 5,
            "baseGoldProductionRate": 0.05
          },
          {
            "id": 8,
            "buildable": {
              "id": 3,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Restaurant"
            },
            "level": 2,
            "buildingOrUpgradingDuration": 30,
            "buildingOrUpgradingRequiredGold": 300,
            "buildingOrUpgradingRequiredResidentsCount": 10,
            "baseGoldProductionRate": 0.11
          },
          {
            "id": 9,
            "buildable": {
              "id": 3,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Restaurant"
            },
            "level": 3,
            "buildingOrUpgradingDuration": 40,
            "buildingOrUpgradingRequiredGold": 700,
            "buildingOrUpgradingRequiredResidentsCount": 15,
            "baseGoldProductionRate": 0.17
          }
        ]
      },
      {
        "id": 4,
        "type": 1,
        "discreteWidth": 2,
        "discreteHeight": 2,
        "displayName": "Barrack",
        "levelConfs": [
          {
            "id": 10,
            "buildable": {
              "id": 4,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Barrack"
            },
            "level": 1,
            "buildingOrUpgradingDuration": 18,
            "buildingOrUpgradingRequiredGold": 250,
            "buildingOrUpgradingRequiredResidentsCount": 5
          },
          {
            "id": 11,
            "buildable": {
              "id": 4,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Barrack"
            },
            "level": 2,
            "buildingOrUpgradingDuration": 25,
            "buildingOrUpgradingRequiredGold": 1500,
            "buildingOrUpgradingRequiredResidentsCount": 10
          },
          {
            "id": 12,
            "buildable": {
              "id": 4,
              "type": 1,
              "discreteWidth": 2,
              "discreteHeight": 2,
              "displayName": "Barrack"
            },
            "level": 3,
            "buildingOrUpgradingDuration": 36,
            "buildingOrUpgradingRequiredGold": 4000,
            "buildingOrUpgradingRequiredResidentsCount": 15
          }
        ]
      },
    ];
    self.refreshStatelessBuildableInstances(self.AllStatelessBuildableInstances);
    let playerBuildableBindingList = cc.sys.localStorage.getItem("playerBuildableBindingList");
    if (null != playerBuildableBindingList) {
      playerBuildableBindingList = JSON.parse(playerBuildableBindingList);
      window.playerBuildableBindingList = playerBuildableBindingList;
      for (let i in playerBuildableBindingList) {
        const playerBuildableBinding = playerBuildableBindingList[i];
        const targetedStatelessBuildableInstance = self._findStatelessBuildableInstance(playerBuildableBinding);
        const statefulBuildableInstance = self.createPerStatefulBuildableInstanceNodes(playerBuildableBinding, targetedStatelessBuildableInstance);
        self.createBoundaryColliderForStatefulBuildableInsatnce(statefulBuildableInstance, self.tiledMapIns);
        self.statefulBuildableInstanceList.push(statefulBuildableInstance.playerBuildableBinding);
        self.statefulBuildableInstanceCompList.push(statefulBuildableInstance);
        self.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
      }
    }

    // self.spawnHomingNpcs();
    self.spawnOrRefreshStatefulBuildableFollowingNpcs();
  },

  sendPlayerSyncDataUpsync(queryParam) {
    // Deliberately left blank.
  },

  _findStatelessBuildableInstance(fromPlayerBuildableBinding) {
    const self = this;
    for (let i in self.statelessBuildableInstanceList) {
      const singleStatelessBuildableInstance = self.statelessBuildableInstanceList[i];
      if (fromPlayerBuildableBinding.buildable.id != singleStatelessBuildableInstance.id) {
        continue;
      }
      return singleStatelessBuildableInstance;
    }
    return null;
  },

  transitBuildableLevelBindingConfToStatelessBuildbaleInstances(buildableLevelConfList) {
    const AllStatelessBuildableInstances = [];
    for (let i in buildableLevelConfList) {
      let isPushedBuildable = false;
      const singleBuildableLevelBinding = buildableLevelConfList[i];
      for (let i in AllStatelessBuildableInstances) {
        const pushedStatelessBuildable = AllStatelessBuildableInstances[i];
        if (pushedStatelessBuildable.id == singleBuildableLevelBinding.buildable.id) {
          if (!pushedStatelessBuildable.levelConfs) {
            pushedStatelessBuildable.levelConfs = [];
          }
          pushedStatelessBuildable.levelConfs.push(singleBuildableLevelBinding);
          isPushedBuildable = true;
          break;
        }
      }
      if (!isPushedBuildable) {
        //TODO: Hardcoded for now. 可以遍历singleBuildableLevelBinding.key来构造buildableLevelBinding.
        const buildableLevelBinding = {
          id: singleBuildableLevelBinding.buildable.id,
          type: singleBuildableLevelBinding.buildable.type,
          discreteWidth: singleBuildableLevelBinding.buildable.discreteWidth,
          discreteHeight: singleBuildableLevelBinding.buildable.discreteHeight,
          displayName: singleBuildableLevelBinding.buildable.displayName,
        }
        buildableLevelBinding.levelConfs = [];
        buildableLevelBinding.levelConfs.push(singleBuildableLevelBinding);
        AllStatelessBuildableInstances.push(buildableLevelBinding);
      }
    }
    return AllStatelessBuildableInstances;
  },

  spawnHomingNpcs() {
    const self = this;
    if (!self.homingNpcPrefab) {
      cc.warn(`There's no "homingNpcPrefab" yet!`);
      return;
    }
    const tiledMapIns = self.tiledMapIns;
    const homingNpcGrandSrcLayer = tiledMapIns.getObjectGroup('HomingNpcGrandSrc');
    if (!homingNpcGrandSrcLayer) {
      return;
    }

    const homingNpcGrandSrcList = homingNpcGrandSrcLayer.getObjects();
    for (let indice = 0; indice < homingNpcGrandSrcList.length; ++indice) {
      let homingNpcGrandSrc = homingNpcGrandSrcList[indice];
      const npcNode = cc.instantiate(self.homingNpcPrefab);
      const npcScriptIns = npcNode.getComponent("HomingNpc");
      npcScriptIns.mapNode = self.node;
      npcScriptIns.mapIns = self;
      const npcSrcContinuousPosWrtMapNode = tileCollisionManager.continuousObjLayerOffsetToContinuousMapNodePos(self.node, homingNpcGrandSrc.offset);
      npcNode.setPosition(npcSrcContinuousPosWrtMapNode);
      safelyAddChild(self.node, npcNode);
      setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);
      npcScriptIns.grandSrc = npcSrcContinuousPosWrtMapNode;
      self.homingNpcScriptInsDict[npcNode.uuid] = npcScriptIns;

      cc.log(`Finding destination for HomingNpc located at ${npcSrcContinuousPosWrtMapNode}`);
      npcScriptIns.refreshCurrentDestination();
      if (null == npcScriptIns.currentDestination) {
        cc.log(`	Destination not found for HomingNpc located at ${npcSrcContinuousPosWrtMapNode}`);
      } else {
        cc.log(`	Found destination for HomingNpc located at ${npcSrcContinuousPosWrtMapNode}: ${npcScriptIns.currentDestination}`);

        cc.log("\t\tVerifying destination for HomingNpc by A* search...");
        const stops = npcScriptIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        if (null == stops) {
          cc.warn(`		[NOT VERIFIED]Path not found for HomingNpc ${npcSrcContinuousPosWrtMapNode} => ${npcScriptIns.currentDestination}`);
          continue;
        }
        cc.log(`		[VERIFIED]Path found for HomingNpc located at ${npcSrcContinuousPosWrtMapNode} => ${npcScriptIns.currentDestination}`, stops);
        npcScriptIns.restartPatrolling();
      }

    }
  },

  spawnOrRefreshStatefulBuildableFollowingNpcs() {
    const self = this;
    if (!self.statefulBuildableFollowingNpcPrefab) {
      cc.warn(`There's no "statefulBuildableFollowingNpcPrefab" yet!`);
      return;
    }
    const tiledMapIns = self.tiledMapIns;
    
    for (let indice = 0; indice < self.statefulBuildableInstanceCompList.length; ++indice) {
      const statefulBuildableInstanceComp = self.statefulBuildableInstanceCompList[indice];
      const npcNode = cc.instantiate(self.statefulBuildableFollowingNpcPrefab);
      const npcScriptIns = npcNode.getComponent("StatefulBuildableFollowingNpc");
      npcScriptIns.mapNode = self.node;
      npcScriptIns.mapIns = self;
      npcScriptIns.boundStatefulBuildable = statefulBuildableInstanceComp;
      const npcSrcContinuousPosWrtMapNode = statefulBuildableInstanceComp.fixedSpriteCentreContinuousPos;
      npcNode.setPosition(npcSrcContinuousPosWrtMapNode);
      safelyAddChild(self.node, npcNode);
      setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);
      npcScriptIns.refreshGrandSrcAndCurrentDestination();
    }
  },

  isStatefulBuildableOutOfMap(statefulBuildableInstance, spriteCentreDiscretePosWrtMapNode) {
    const self = this;
    const anchorTileDiscretePosWrtMap = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
    // TODO: Return true or false based on whether `anchorTileDiscretePosWrtMap` is out of the discrete map bound.
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    return 0 > anchorTileDiscretePosWrtMap.x || 0 > anchorTileDiscretePosWrtMap.y || currentLayerSize.width - discreteWidth < anchorTileDiscretePosWrtMap.x || currentLayerSize.height - discreteHeight < anchorTileDiscretePosWrtMap.y;
  },

  correctDiscretePositionToWithinMap(statefulBuildableInstance, discretePos) {
    let mapIns = this;
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = mapIns.highlighterLayer.getLayerSize();
    let toRet = cc.v2();
    toRet.x = Math.max(0, discretePos.x);
    toRet.x = Math.min(toRet.x, currentLayerSize.width - discreteWidth);
    toRet.y = Math.max(0, discretePos.y);
    toRet.y = Math.min(toRet.y, currentLayerSize.height - discreteHeight);
    return toRet;
  },

  isEditingStatefulBuildableInstanceNodeOnBoundary() {
    const self = this,
      mapIns = self;
    if (null == self.editingStatefulBuildableInstance) {
      return false;
    }
    let statefulBuildableInstance = self.editingStatefulBuildableInstance;
    let editingStatefulBuildableInstanceNode = statefulBuildableInstance.node;
    let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, editingStatefulBuildableInstanceNode.position, cc.v2(0, 0));
    spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
    const anchorTileDiscretePosWrtMap = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
    let {discreteWidth, discreteHeight} = statefulBuildableInstance;
    let currentLayerSize = self.highlighterLayer.getLayerSize();
    return anchorTileDiscretePosWrtMap.x == 0 || anchorTileDiscretePosWrtMap.y == 0 || anchorTileDiscretePosWrtMap.x + discreteWidth == currentLayerSize.width || anchorTileDiscretePosWrtMap.y + discreteHeight == currentLayerSize.height;
  },

  onStatefulBuildableInstanceInfoButtonClicked(evt) {
    const self = this;
    const statefulBuildableInstance = self.editingStatefulBuildableInstance;
    if (!statefulBuildableInstance) {
      cc.warn("The expected `mapIns.editingStatefulBuildableInstance` doesn't exist.")
      return;
    }
    const statefulBuildableInstanceNode = self.editingStatefulBuildableInstance.node;
    if (!self.addShowingModalPopup()) return;
    self.statelefulBuildableController.active = false;
    switch (statefulBuildableInstance.state) {
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_NEW:
        self.removePositioningNewStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_NEW, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_BUILDING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_BUILDING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      case window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_WHILE_UPGRADING:
        self.removeEditingExistingStatefulBuildableInstance();
        statefulBuildableInstance.updateCriticalProperties(window.STATEFUL_BUILDABLE_INSTANCE_STATE.EDITING_PANEL_WHILE_UPGRADING, statefulBuildableInstance.fixedSpriteCentreContinuousPos, statefulBuildableInstance.currentLevel, statefulBuildableInstance.buildingOrUpgradingStartedAt);
        break;
      default:
        cc.warn("Show statefulBuildableInstancePanelNode not in editing state.")
        break;
    }
    const statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    const statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent("StatefulBuildableInstanceInfoPanel");
    statefulInstanceInfoPanelScriptIns.setInfo(self.editingStatefulBuildableInstance);
    window.safelyAddChild(self.widgetsAboveAllNode, statefulBuildableInstanceNode.statefulInstanceInfoPanelNode);
  },

  upgradeStatefulBuildableInstance(evt, statefulBuildableInstance) {
    const self = this;
    if (!statefulBuildableInstance.isUpgradable()) {
      cc.warn("upgrade StatefulBuildableInstance when it isn't upgradeable", statefulBuildableInstance);
      return;
    }
    const targetedStatelessBuildableInstance = self._findStatelessBuildableInstance(statefulBuildableInstance.playerBuildableBinding);
    const statefulBuildableInstanceNode = statefulBuildableInstance.node;
    const statefulInstanceInfoPanelNode = statefulBuildableInstanceNode.statefulInstanceInfoPanelNode;
    const statefulInstanceInfoPanelScriptIns = statefulInstanceInfoPanelNode.getComponent("StatefulBuildableInstanceInfoPanel");
    statefulBuildableInstance.upgradeUnconditionally();
    statefulInstanceInfoPanelScriptIns.setInfo(statefulBuildableInstance);
  },

  findStatefulBuildableInstanceAtPosition(touchPosInCamera) {
    const self = this;
    const mapIns = this;
    const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position; // With respect to CanvasNode.
    const roughImmediateContinuousPosOfCameraOnMapNode = (mainCameraContinuousPos.add(cc.v2(touchPosInCamera.x, touchPosInCamera.y)));
    const immediateDiscretePosOfCameraOnMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, roughImmediateContinuousPosOfCameraOnMapNode, cc.v2(0, 0));
    const targetCpns = mapIns.statefulBuildableInstanceCompList.concat(self.editingStatefulBuildableInstance).filter((statefulBuildableInstance) => {
      if (!statefulBuildableInstance) {
        return false;
      }
      let spriteCentreDiscretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(mapIns.node, mapIns.tiledMapIns, statefulBuildableInstance.node.position, cc.v2(0, 0));
      spriteCentreDiscretePosWrtMapNode = cc.v2(spriteCentreDiscretePosWrtMapNode);
      let anchorTileDiscretePosWrtMapNode = spriteCentreDiscretePosWrtMapNode.sub(statefulBuildableInstance.spriteCentreTileToAnchorTileDiscreteOffset);
      return anchorTileDiscretePosWrtMapNode.x <= immediateDiscretePosOfCameraOnMapNode.x
        && anchorTileDiscretePosWrtMapNode.x + statefulBuildableInstance.discreteWidth > immediateDiscretePosOfCameraOnMapNode.x
        && anchorTileDiscretePosWrtMapNode.y <= immediateDiscretePosOfCameraOnMapNode.y
        && anchorTileDiscretePosWrtMapNode.y + statefulBuildableInstance.discreteHeight > immediateDiscretePosOfCameraOnMapNode.y;
    });
    if (targetCpns != null) {
      // editingStatefulBuildableInstance has higher priority.
      if (self.editingStatefulBuildableInstance && targetCpns.includes(self.editingStatefulBuildableInstance)) {
        return self.editingStatefulBuildableInstance;
      } else {
        return targetCpns[0];
      }
    } else {
      return null;
    }
  },
});
