cc.Class({
  extends: cc.Component,

  properties: {
    prefabs: {
      type: [cc.Prefab],
      default: [],
    },
    buildButton: {
      type: cc.Button,
      default: null,
    },
    cancelBuildButton: {
      type: cc.Button,
      default: null,
    },
    confirmBuildButton: {
      type: cc.Button,
      default: null,
    },
    joystickContainerNode: {
      type: cc.Node,
      default: null,
    },
    statefulBuildableInstanceInfoButton: {
      type: cc.Button,
      default: null,
    },
    statelefulBuildableController: {
       type:cc.Node,
       default: null,
    } 
  },

  onLoad() {
    const self = this
  // TBD.
  },

  init(mapScriptIns, mapNode, canvasNode, isUsingJoystick) {
    const self = this;
    self.mapNode = mapNode;
    self.canvasNode = canvasNode;
    self.mapScriptIns = mapScriptIns;
    self.touchEventManagerScriptIns = self.node.getComponent("TouchEventsManager");
    self.touchEventManagerScriptIns.init(mapScriptIns, mapNode, canvasNode, isUsingJoystick);
    mapScriptIns.statelefulBuildableController = this.statelefulBuildableController;

    if (isUsingJoystick && self.joystickContainerNode) {
      self.joystickContainerNode.active = true; 
    }

    // Initialization of the `buildButton` [begins].
    const buildBtnHandler = new cc.Component.EventHandler();
    buildBtnHandler.target = mapNode;
    buildBtnHandler.component = mapNode.name;
    buildBtnHandler.handler = "onBuildButtonClicked";
    this.buildButton.clickEvents = [
      buildBtnHandler
    ];
    mapScriptIns.buildButton = this.buildButton;
    // Initialization of the `buildButton` [ends].

    // Initialization of the `cancelBuildButton` [begins].
    const cancelBuildBtnHandler = new cc.Component.EventHandler();
    cancelBuildBtnHandler.target = mapNode;
    cancelBuildBtnHandler.component = mapNode.name;
    cancelBuildBtnHandler.handler = "onCancelBuildButtonClicked";
    this.cancelBuildButton.clickEvents = [
      cancelBuildBtnHandler
    ];
    mapScriptIns.cancelBuildButton = this.cancelBuildButton;
    // Initialization of the `cancelBuildButton` [ends].
    
    // Initialization of the `statefulBuildableInstanceInfoButton` [begins].
    const statefulBuildableInstanceInfoBtnHandler = new cc.Component.EventHandler();
    statefulBuildableInstanceInfoBtnHandler.target = mapNode;
    statefulBuildableInstanceInfoBtnHandler.component = mapNode.name;
    statefulBuildableInstanceInfoBtnHandler.handler = "onStatefulBuildableInstanceInfoButtonClicked";
    this.statefulBuildableInstanceInfoButton.clickEvents = [
      statefulBuildableInstanceInfoBtnHandler
    ];
    mapScriptIns.statefulBuildableInstanceInfoButton = this.statefulBuildableInstanceInfoButton;
    // Initialization of the `statefulBuildableInstanceInfoButton` [ends].

    // Initialization of the `confirmBuildButton` [begins].
    const confirmBuildBtnHandler = new cc.Component.EventHandler();
    confirmBuildBtnHandler.target = mapNode;
    confirmBuildBtnHandler.component = mapNode.name;
    confirmBuildBtnHandler.handler = "onConfirmBuildButtonClicked";
    this.confirmBuildButton.clickEvents = [
      confirmBuildBtnHandler
    ];
    mapScriptIns.confirmBuildButton = this.confirmBuildButton;
    // Initialization of the `confirmBuildButton` [ends].
  },
});
