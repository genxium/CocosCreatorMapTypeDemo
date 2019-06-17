cc.Class({
  extends: cc.Component,

  properties: {
    appearance: {
      type: cc.Sprite,
      default: null,
    }
  },

  setData(itemData) {
    const self = this;
    self.appearance.spriteFrame = itemData.appearance;
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.node.on(cc.Node.EventType.TOUCH_START, (event) => {
      self.mapIns.onStartDraggingItem && self.mapIns.onStartDraggingItem(self);
      // 鼠标穿透至mapIns，即调用mapIns的TOUCH_START
      // 相关参数：target, _touches[0]
      let evt = new cc.Event.EventTouch([event._touches[0]], true);
      evt.type = cc.Node.EventType.TOUCH_START;
      evt.target = self.mapIns.node;
      self.mapIns.node.dispatchEvent(evt);
    });
  },

  onLoad() {},

})
