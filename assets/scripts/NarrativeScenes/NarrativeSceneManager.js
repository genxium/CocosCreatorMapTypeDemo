const NarrativeSceneManagerDelegate = require('./NarrativeSceneManagerDelegate');
const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

cc.Class({
  extends: cc.Component,

  properties: {
    narrativeScenePrefab: {
      type: cc.Prefab,
      default: null,
    },
    delegate: {
      type: NarrativeSceneManagerDelegate,
      default: null,
    },
  },

  showTutorialStage(previousTutorialStage, forStageIndex) {
    if (forStageIndex == constants.TUTORIAL_STAGE.ENDED) {
      // WARNING: Must use exact equaling '==' here!!!
      this.delegate.initAfterAllTutorialStages();
      if (null == previousTutorialStage) {
        return; 
      }
    }
    if (null != previousTutorialStage) {
      if (previousTutorialStage < constants.TUTORIAL_STAGE.ENDED) {
        const narrativeSceneNode = this._getNarrativeScene(forStageIndex); 
        this.delegate.showNarrativeSceneByProperScale(narrativeSceneNode);
      }
    } else {
      // null == previousTutorialStage
      if (forStageIndex < constants.TUTORIAL_STAGE.ENDED) {
        const narrativeSceneNode = this._getNarrativeScene(forStageIndex); 
        this.delegate.showNarrativeSceneByProperScale(narrativeSceneNode);
      }
    }
  },

  _hideCurrentTransitButton(evt, customEventData) {
    const self = this;
    const narrativeSceneNode = self.currentNarrativeSceneNode; 
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    
    narrativeSceneScriptIns.transitButton.node.active = false;
  },

  _getNarrativeScene(byStageIndex) {
    const narrativeSceneNode = cc.instantiate(this.narrativeScenePrefab);
    this.currentNarrativeSceneNode = narrativeSceneNode;

    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene"); 
    narrativeSceneScriptIns.transitButton.node.getChildByName("Label").getComponent(cc.Label).string = i18n.t("Tutorial.Next");
    narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements." + byStageIndex);

    // Reference http://docs.cocos2d-x.org/creator/api/en/classes/Component.EventHandler.html.
    const theTemplateButtonOnClickHandler = new cc.Component.EventHandler();
    theTemplateButtonOnClickHandler.target = this.delegate.node;
    theTemplateButtonOnClickHandler.component = "NarrativeSceneManagerDelegate"; // Can be any other component attached to `delegate.node`. 
    theTemplateButtonOnClickHandler.handler = "endCurrentNarrativeSceneIfApplicable"; // Can be any other method of `theTemplateButtonOnClickHandler.handler`, as long as `delegate.endCurrentNarrativeSceneIfApplicable()` is guaranteed to be called. 

    narrativeSceneScriptIns.transitButton.clickEvents = [
      theTemplateButtonOnClickHandler,
    ];
  
    let thePanelNode = null;
    let thePanelButton = null;
    let thePanelScriptIns = null;
    let anotherButtonOnClickHandler = null;
    let yetAnotherButtonOnClickHandler = null;
    let popupAnimDurationSeconds = 0.5;
    let hiddenTransiteButtonNode = null;
    switch (byStageIndex) {
      default:
      break;
    }

    return narrativeSceneNode;
  },

  updateTransitButton(transitBtn, toReplaceBtn) {
    if (transitBtn.getComponent(cc.Sprite) && toReplaceBtn.getComponent(cc.Sprite)) {
      transitBtn.getComponent(cc.Sprite).spriteFrame = toReplaceBtn.getComponent(cc.Sprite).spriteFrame; 
      transitBtn.getComponent(cc.Sprite).sizeMode = toReplaceBtn.getComponent(cc.Sprite).sizeMode; // Note that for cc.Sprite, `sizeMode` must be set before setting the `width` and `height` of the node to function.
    }
    transitBtn.width = toReplaceBtn.width;
    transitBtn.height = toReplaceBtn.height;
    transitBtn.setScale(toReplaceBtn.scale);
    transitBtn.setAnchorPoint(toReplaceBtn.getAnchorPoint());
    const labelNode = transitBtn.getChildByName("Label");
    const animNode = transitBtn.getChildByName("Anim");

    let btnAnim = toReplaceBtn.getChildByName("Anim");
    if (btnAnim) {
      if (btnAnim.getComponent(cc.Sprite)) {
        animNode.getComponent(cc.Sprite).spriteFrame = btnAnim.getComponent(cc.Sprite).spriteFrame; 
        animNode.getComponent(cc.Sprite).sizeMode = btnAnim.getComponent(cc.Sprite).sizeMode;
      }
      animNode.setAnchorPoint(btnAnim.getAnchorPoint());
      animNode.setPosition(btnAnim.position);
      animNode.setScale(btnAnim.scale);
      animNode.width = btnAnim.width;
      animNode.height = btnAnim.height;
      animNode.getComponent(cc.Animation)._clips = btnAnim.getComponent(cc.Animation)._clips; 
      animNode.getComponent(cc.Animation)._defaultClip = btnAnim.getComponent(cc.Animation)._defaultClip; 
      animNode.getComponent(cc.Animation).play(); 
    }

    let btnLabel = toReplaceBtn.getChildByName("label");
    if(!btnLabel){
      btnLabel =  toReplaceBtn.getChildByName("Label");
    }
    if(!btnLabel){
      labelNode.getComponent(cc.Label).string = "";
      return;
    }
    labelNode.setAnchorPoint(btnLabel.getAnchorPoint());
    labelNode.setPosition(btnLabel.position);
    labelNode.width = btnLabel.width;
    labelNode.height = btnLabel.height;
    labelNode.getComponent(cc.Label).string = btnLabel.getComponent(cc.Label).string;
    labelNode.getComponent(cc.Label).font = btnLabel.getComponent(cc.Label).font;
    labelNode.getComponent(cc.Label).fontSize = btnLabel.getComponent(cc.Label).fontSize;
    labelNode.getComponent(cc.Label).fontFamily = btnLabel.getComponent(cc.Label).fontFamily;
    labelNode.getComponent(cc.Label).lineHeight = btnLabel.getComponent(cc.Label).lineHeight;
    labelNode.getComponent(cc.Label).overflow = btnLabel.getComponent(cc.Label).overflow;
  },

  onLoad() {
    this.hiddenTransiteButtonPool = new cc.NodePool();
    this.currentNarrativeSceneNode = null;
  },

  update() {},
});
