cc.Class({
  extends: cc.PolygonCollider,
  properties: {},

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
  },

  onCollisionEnter(other, self) {
    self.mapIns.onItemAcceptIn(self.statefulBuildableInstance);
  },

  onCollisionStay(other, self) {
    self.mapIns.onItemAcceptIn(self.statefulBuildableInstance);
  },

  onCollisionExit(other, self) {
    self.mapIns.onItemAcceptOut(self.statefulBuildableInstance);

  }

});
