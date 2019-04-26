cc.Class({
  extends: cc.Component,

  properties: {
    mapNode: {
      type: cc.Node,
      default: null
    }
  },

  onLoad() {
    this.mainCamera = this.mapNode.parent.getChildByName("Main Camera").getComponent(cc.Camera);
    this.mapScriptIns = this.mapNode.getComponent("Map");
  },

  start() {},

  update(dt) {
    const self = this;
    if (!self.mainCamera) return;
    if (!self.mapScriptIns) return;
    const selfPlayerNode = self.mapScriptIns.selfPlayerNode;
    if (!selfPlayerNode) return;
    self.mainCamera.node.setPosition(selfPlayerNode.position);
  }
});

