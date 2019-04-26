window.ALL_MAP_STATES = {
  VISUAL: (1 << 0), // For free dragging & zooming.
  POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE: (1 << 1),
  SHOWING_MODAL_POPUP: (1 << 2),
  IN_NARRATIVE_SCENE: (1 << 3),
  EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE: (1 << 4),
};

module.export = cc.Class({
  extends: cc.Component,

  properties: {
    canvasNode: {
      type: cc.Node,
      default: null, 
    },
    widgetsAboveAllPrefab: {
      type: cc.Prefab,
      default: null, 
    },
    isUsingJoystick: {
      default: false,
    },
  },

  addStateBit(thatBit) {
    if (0 == (this.state & thatBit)) {
      this.state |= thatBit;
      return true;
    }
    return false;
  },

  removeStateBit(thatBit) {
    if (0 < (this.state & thatBit)) {
      this.state &= ~thatBit;
      return true;
    }
    return false;
  },

  havingStateBit(thatBit) {
    return (0 < (this.state & thatBit));
  },

  addInNarrative() {
    return this.addStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  removeInNarrative() {
    return this.removeStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  isInNarrativeScene() {
    return this.havingStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  addPositioningNewStatefulBuildableInstance() {
    return this.addStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  removePositioningNewStatefulBuildableInstance() {
    return this.removeStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  isPositioningNewStatefulBuildableInstance() {
    return this.havingStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  addEditingExistingStatefulBuildableInstance() {
    return this.addStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  removeEditingExistingStatefulBuildableInstance() {
    return this.removeStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  isEditingExistingStatefulBuildableInstance() {
    return this.havingStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  addShowingModalPopup() {
    return this.addStateBit(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
  },
  
  removeShowingModalPopup() {
    return this.removeStateBit(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
  },

  isPurelyVisual() {
    return (0 < (this.state & ALL_MAP_STATES.VISUAL)) && (0 == (this.state & ~ALL_MAP_STATES.VISUAL));
  }, 

  onLoad() {
    const self = this;
    self.state = ALL_MAP_STATES.VISUAL;
    const attachedToNode = self.node;
    self.narrativeSceneManager = attachedToNode.getComponent("NarrativeSceneManager");
    if (null == self.narrativeSceneManager) {
      cc.warn("You should attach a `NarrativeSceneManager` to the node of a `NarrativeSceneManagerDelegate`!");
    }
    self.currentTutorialStage = 0;

    const canvasNode = self.canvasNode;
    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);

    // Initialization of the "widgetsAboveAllNode" [begins].
    self.widgetsAboveAllNode = cc.instantiate(self.widgetsAboveAllPrefab);
    self.widgetsAboveAllNode.width = canvasNode.width;
    self.widgetsAboveAllNode.height = canvasNode.height;
    self.widgetsAboveAllNode.setScale(1 / self.mainCamera.zoomRatio);
    setLocalZOrder(self.mainCameraNode, 999);
    safelyAddChild(self.mainCameraNode, self.widgetsAboveAllNode);

    self.widgetsAboveAllScriptIns = self.widgetsAboveAllNode.getComponent("WidgetsAboveAll");

    self.widgetsAboveAllScriptIns.init(self, attachedToNode, canvasNode, self.isUsingJoystick);
    for (let prefab of self.widgetsAboveAllScriptIns.prefabs) {
      const firstChStr = prefab.name.substring(0, 1);
      const remainingNameStr = prefab.name.substring(1, prefab.name.length);
      const prefabFieldName = firstChStr.toLowerCase() + remainingNameStr + "Prefab";
      self[prefabFieldName] = prefab; // Dynamically adding properties.
    }
    // Initialization of the "widgetsAboveAllNode" [ends].

    for (let child of self.mainCameraNode.children) {
      child.setScale(1 / self.mainCamera.zoomRatio);
    }
  },

  showNarrativeSceneByProperScale(narrativeScene) {
    const narrativeSceneScriptIns = narrativeScene.getComponent("NarrativeScene"); 
    this.narrativeSceneLayer.removeAllChildren();
    safelyAddChild(this.narrativeSceneLayer, narrativeScene);
    this.narrativeSceneLayer.active = true;
    this.addInNarrative();
  },

  endCurrentNarrativeSceneIfApplicable(evt, toSpecifiedStage) {
    if (null != evt) {
      evt.stopPropagation(); 
    }
    this.removeInNarrative();
  },

  onCurrentNarrativeSceneEnded(toSpecifiedStage) {
    const previousTutorialStage = this.currentTutorialStage; 
    if (null != toSpecifiedStage) {
      this.currentTutorialStage = toSpecifiedStage;
    } else {
      ++this.currentTutorialStage;
    }
    this.narrativeSceneLayer.active = false;
    if (null == this.narrativeSceneManager) return;

    this.narrativeSceneManager.showTutorialStage(previousTutorialStage, this.currentTutorialStage);
  },

  initAfterAllTutorialStages() {
    this.removeInNarrative();
  },
});
