const BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,
  properties: {
    joystickInputControllerNode: {
      type: cc.Node,
      default: null,
    },
  },

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.clips = {
      '01': 'FlatHeadSisterRunTop',
      '0-1': 'FlatHeadSisterRunBottom',
      '-20': 'FlatHeadSisterRunLeft',
      '20': 'FlatHeadSisterRunRight',
      '-21': 'FlatHeadSisterRunTopLeft',
      '21': 'FlatHeadSisterRunTopRight',
      '-2-1': 'FlatHeadSisterRunBottomLeft',
      '2-1': 'FlatHeadSisterRunBottomRight'
    };
  },

  _canMoveBy(vecToMoveBy) {
    return BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
  },

  update(dt) {
    const self = this;
    BasePlayer.prototype.update.call(this, dt);

    const vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (self._canMoveBy(vecToMoveBy)) {
      self.node.position = self.computedNewDifferentPosLocalToParentWithinCurrentFrame;
    }

    const labelNode = this.node.getChildByName("CoordinateLabel");
    labelNode.getComponent(cc.Label).string = "M_(" + this.node.x.toFixed(2) + ", " + this.node.y.toFixed(2) + ")";
  },

  onCollisionEnter(other, selfCollider) {
    const self = this;
    BasePlayer.prototype.onCollisionEnter.call(this, other, selfCollider);
    const mapIns = self.mapNode.getComponent('Map');
    const tiledMapIns = self.mapNode.getComponent(cc.TiledMap);
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        window.previewShelter(mapIns, self.mapNode, other.node.pTiledLayer, other.node.tileDiscretePos);
        break;
      default:
        break;
    }
  },

  onCollisionExit(other, selfCollider) {
    const self = this;
    BasePlayer.prototype.onCollisionExit.call(this, other, selfCollider);
    const mapIns = self.mapNode.getComponent('Map');
    switch (other.node.name) {
      case "PolygonBoundaryShelter":
        window.cancelPreviewingOfShelter(mapIns, self.mapNode, other.node.pTiledLayer, other.node.tileDiscretePos);
        break;
      default:
        break;
    }
  },
});
