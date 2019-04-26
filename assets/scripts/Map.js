const NarrativeSceneManagerDelegate = require('./NarrativeScenes/NarrativeSceneManagerDelegate');

window.removeFog = function(mapScriptIns, mapNode, playerContinuousPosInMap) {
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  const fogLayer = tiledMapIns.getLayer("Fog");

  if (!fogLayer) return;
  const fogDiscreteTilePos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, fogLayer, playerContinuousPosInMap, cc.v2(0, 0));
  const fogLayerSize = fogLayer.getLayerSize();
  const linearDxBoundOfViewArea = 3;
  const linearDyBoundOfViewArea = 3;
  for (let adjacentDx = -linearDxBoundOfViewArea; adjacentDx <= +linearDxBoundOfViewArea; ++adjacentDx) {
    for (let adjacentDy = -linearDyBoundOfViewArea; adjacentDy <= +linearDyBoundOfViewArea; ++adjacentDy) {
      const theDiscretePosOfFogToRemove = cc.v2(fogDiscreteTilePos.x + adjacentDx, fogDiscreteTilePos.y + adjacentDy);
      if (0 > theDiscretePosOfFogToRemove.x || 0 > theDiscretePosOfFogToRemove.y || fogLayerSize.width <= fogDiscreteTilePos.x || fogLayerSize.height <= fogDiscreteTilePos.y) continue;
      fogLayer.setTileGIDAt(0, theDiscretePosOfFogToRemove.x, theDiscretePosOfFogToRemove.y);
    }
  }
};

cc.Class({
  extends: NarrativeSceneManagerDelegate,

  properties: {
    selfPlayerPrefab: {
      type: cc.Prefab,
      default: null,
    },
    npcPlayerPrefab: {
      type: cc.Prefab,
      default: null,
    },
    type2NpcPlayerPrefab: {
      type: cc.Prefab,
      default: null,
    },
  },

  ctor() {
    this.selfPlayerNode = null;
    this.ctrl = null;
    this.editingStatefulBuildableInstance = null;
  },

  // LIFE-CYCLE CALLBACKS:
  onDestroy() {
    clearInterval(this.inputControlTimer)
  },

  onLoad() {
    NarrativeSceneManagerDelegate.prototype.onLoad.call(this);

    const self = this;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;

    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
    tileCollisionManager.initMapNodeByTiledBoundaries(self, mapNode, boundaryObjs);

    // Spawning player nodes.
    self.spawnSelfPlayer();
    this._inputControlEnabled = true;
    self.setupInputControls();
  },

  setupInputControls() {
    const instance = this;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    const selfPlayerScriptIns = instance.selfPlayerNode.getComponent("SelfPlayer");
    instance.ctrl = instance.widgetsAboveAllScriptIns.touchEventManagerScriptIns;
    const inputControlPollerMillis = (1000 / instance.ctrl.pollerFps);

    instance.inputControlTimer = setInterval(function() {
      if (false == instance._inputControlEnabled) return;
      if (null == instance.ctrl.activeDirection) return;

      const newScheduledDirectionInWorldCoordinate = {
        dx: instance.ctrl.activeDirection.dx,
        dy: instance.ctrl.activeDirection.dy
      };

      const newScheduledDirectionInLocalCoordinate = newScheduledDirectionInWorldCoordinate;
      selfPlayerScriptIns.scheduleNewDirection(newScheduledDirectionInLocalCoordinate);
    }, inputControlPollerMillis);
  },

  enableInputControls() {
    this._inputControlEnabled = true;
  },

  disableInputControls() {
    this._inputControlEnabled = false;
  },

  spawnSelfPlayer() {
    const self = this;
    const newPlayer = cc.instantiate(self.selfPlayerPrefab);
    newPlayer.setPosition(cc.v2(0, 0));
    newPlayer.getComponent("SelfPlayer").mapNode = self.node;
    const canvasNode = self.node.parent;
    newPlayer.getComponent("SelfPlayer").joystickInputControllerNode = canvasNode;

    self.node.addChild(newPlayer);

    setLocalZOrder(newPlayer, 5);
    this.selfPlayerNode = newPlayer;
  },

  spawnNPCs() {
    const self = this;
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const npcPatrolLayer = tiledMapIns.getObjectGroup('NPCPatrol');

    const npcList = npcPatrolLayer.getObjects();
    npcList.forEach(function(npcPlayerObj, index) {
      const npcPlayerNode = cc.instantiate(self.npcPlayerPrefab);
      const npcPlayerContinuousPositionWrtMapNode = tileCollisionManager.continuousObjLayerOffsetToContinuousMapNodePos(self.node, npcPlayerObj.offset);
      npcPlayerNode.getChildByName('username').getComponent(cc.Label).string = npcPlayerObj.name;
      npcPlayerNode.setPosition(npcPlayerContinuousPositionWrtMapNode);

      npcPlayerNode.getComponent('NPCPlayer').mapNode = self.node;
      safelyAddChild(self.node, npcPlayerNode);
      setLocalZOrder(npcPlayerNode, 5);
    });
  },

  update(dt) {
    const self = this;
    const selfPlayerNode = self.selfPlayerNode;
    if (!selfPlayerNode) return;
    const mapScriptIns = self;
    window.removeFog(mapScriptIns, self.node, selfPlayerNode.position);
  },

});

