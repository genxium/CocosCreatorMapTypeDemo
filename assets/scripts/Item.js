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
    if (self.eventInited) {
      return;
    }
    self.eventInited = true;
    self.node.on(cc.Node.EventType.TOUCH_START, (evt) => {
      if (!self.mapIns.isPurelyVisual()) {
        return;
      }
      self.dragging = false;
      // 鼠标穿透至mapIns，即调用mapIns的TOUCH_START
      // 相关参数：target, _touches[0]
      self.dispatchEvent(cc.Node.EventType.TOUCH_START, evt);
    });
    self.node.on(cc.Node.EventType.TOUCH_MOVE, (evt) => {
      if (self.mapIns.isPurelyVisual() && !self.dragging && !self.node.getBoundingBox().contains(evt.getLocation())) {
        self.dragging = true;
        self.mapIns.onStartDraggingItem && self.mapIns.onStartDraggingItem(self, evt._touches[0].getLocation());
      }
      self.dispatchEvent(cc.Node.EventType.TOUCH_MOVE, evt); 
    });
    self.node.on(cc.Node.EventType.TOUCH_END, self.cancelDraggingItem.bind(self));
    self.node.on(cc.Node.EventType.TOUCH_CANCEL, self.cancelDraggingItem.bind(self));
  },

  onLoad() {
    const self = this;
    self.eventInited = false;
    self.dragging = false;
  },

  cancelDraggingItem(evt) {
    const self = this;
    if (self.mapIns.isDraggingItem()) {
      if (!self.node.getBoundingBox().contains(evt.getLocation())) {
        self.dispatchEvent(cc.Node.EventType.TOUCH_END, evt);
      }
      self.mapIns.onCancelDraggingItem && self.mapIns.onCancelDraggingItem();
    }
  },

  dispatchEvent(type, evt) {
    const self = this;
    let newEvt = new cc.Event.EventTouch(evt._touches, true);
    newEvt.type = type;
    newEvt.target = self.mapIns.node;
    newEvt.currentTouch = evt._touches[0];
    newEvt.touch = evt._touches[0];
    return self.mapIns.node.dispatchEvent(newEvt);
  },

  onLoad() {},

})
