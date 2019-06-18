cc.Class({
  extends: cc.Component,

  properties: {
    appearance: {
      type: cc.Sprite,
      default: null,
    },
    boundingNode: {
      type: cc.Node,
      default: null,
    },
  },

  setData(itemData) {
    const self = this;
    self.data = itemData;
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
      if (self.mapIns.isPurelyVisual() && !self.dragging && !self.isTouchPointInsideBoundingNode(evt.getLocation())) {
        self.dragging = true;
        self.mapIns.onStartDraggingItem && self.mapIns.onStartDraggingItem(self, evt._touches[0].getLocation());
      }
      if (self.dragging) {
        self.dispatchEvent(cc.Node.EventType.TOUCH_MOVE, evt); 
      }
    });
    self.node.on(cc.Node.EventType.TOUCH_END, self.cancelDraggingItem.bind(self));
    self.node.on(cc.Node.EventType.TOUCH_CANCEL, self.cancelDraggingItem.bind(self));
  },

  onLoad() {
    const self = this;
    self.eventInited = false;
    self.dragging = false;
    self.disableCollider();
  },

  enableCollider() {
    const self = this;
    self.getComponent(cc.BoxCollider).enabled = true;
  },

  disableCollider() {
    const self = this;
    self.getComponent(cc.BoxCollider).enabled = false;
  },

  getBoundingNode() {
    const self = this;
    if (self.boundingNode) {
      return self.boundingNode;
    }
    return self.node;
  },

  isTouchPointInsideBoundingNode(touchLocation) {
    const self = this;
    let boundingNode = self.getBoundingNode(), mainCamera = self.mapIns.mainCamera;
    let currentBoundingCenterPoint = boundingNode.convertToWorldSpaceAR(cc.v2()),
        currentCameraCenterPoint = mainCamera.node.convertToWorldSpaceAR(cc.v2());
    let r = mainCamera.zoomRatio;
    let targetBoundingCenterPoint = cc.v2(
      r * currentBoundingCenterPoint.x - (r - 1) * currentCameraCenterPoint.x,
      r * currentBoundingCenterPoint.y - (r - 1) * currentCameraCenterPoint.y
    );
    targetBoundingCenterPoint = targetBoundingCenterPoint.sub(mainCamera.node.position);
    let bottomLeftPoint = targetBoundingCenterPoint.sub(cc.v2(boundingNode.width/2, boundingNode.height/2));
    const inside = bottomLeftPoint.x <= touchLocation.x && bottomLeftPoint.x + boundingNode.width >= touchLocation.x
        && bottomLeftPoint.y <= touchLocation.y && bottomLeftPoint.y + boundingNode.height >= touchLocation.y
    // cc.log('inside', inside, targetBoundingCenterPoint, boundingNode.getContentSize(), touchLocation);
    return inside;
  },

  cancelDraggingItem(evt) {
    const self = this;
    if (self.mapIns.isDraggingItem()) {
      if (!self.isTouchPointInsideBoundingNode(evt.getLocation())) {
        self.dispatchEvent(cc.Node.EventType.TOUCH_END, evt);
      }
      self.mapIns.onDropItem && self.mapIns.onDropItem(evt);
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


})
