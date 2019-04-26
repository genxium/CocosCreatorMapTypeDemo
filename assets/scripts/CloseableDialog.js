cc.Class({
  extends: cc.Component,

  properties: {
    closeBtn: {
      type: cc.Button,
      default: null,
    },
    onCloseDelegate: {
      type: cc.Object,
      default: null,
    },
    musicEffect: {
      type: cc.AudioClip,
      default: null,
    },
    defaultActionsEnabled: {
      default: true,
    }
  },

  onEnable() {
    if (this.defaultActionsEnabled) {
      this.node.setScale(0.3);
      const scalingSeq = cc.sequence(
        cc.scaleTo(0.2, 1.2),
        cc.scaleTo(0.2, 1.0),
      );
      const spawn = cc.spawn(cc.fadeIn(0.2), scalingSeq);
      this.node.runAction(spawn);
    }
  },

  onDisable() {
    // Deliberately left blank.
  },

  onLoad() {
    const theCloseBtnOnClickHandler = new cc.Component.EventHandler();
    theCloseBtnOnClickHandler.target = this.node;
    theCloseBtnOnClickHandler.component = "CloseableDialog";
    theCloseBtnOnClickHandler.handler = "onCloseClicked";
    theCloseBtnOnClickHandler.customData = null;
    this.closeBtn.clickEvents = [
      theCloseBtnOnClickHandler
    ];
    this.musicEffect = cc.url.raw(constants.BGM.DIR_PATH + constants.BGM.BUTTON_CLICK_EFFECT_FILE_NAME);
    const musciEffectButtonOnClickHandler = new cc.Component.EventHandler();
    musciEffectButtonOnClickHandler.target = this.node;
    musciEffectButtonOnClickHandler.component = "CloseableDialog"; 
    musciEffectButtonOnClickHandler.handler ="playMusicEffect" 
    this.musciEffectButtonOnClickHandler = musciEffectButtonOnClickHandler;
  },

  playMusicEffect(evt) {
    if(this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
  },
  disableCloseButtonOnce() {
    // WARNING: This method should be used only exclusively by "NarrativeScene" and its closely relevant classes.
    this.closeBtn.node.active = false;
  },

  _closeWithoutDefaultAction() {
    if (null != this.node.parent) {
      this.node.parent.removeChild(this.node);
    }
    if (false == this.closeBtn.node.active) {
      this.closeBtn.node.active = true;
    }
    if (!this.onCloseDelegate) return;
    this.onCloseDelegate();
  },

  onCloseClicked(evt, customData) {
    const self = this;
    if (null != evt) {
      evt.stopPropagation();
      if (this.musicEffect) {
        try {
          cc.audioEngine.playEffect(this.musicEffect, false, 1);
        } catch (err) {
          cc.error(err);
        }
      }
    }
    if (this.defaultActionsEnabled) {
      cc.log(`CloseableDialog.onCloseClicked called with defaultActionsEnabled.`);
      const animDurationSeconds = 0.2;
      const spawn = cc.spawn(
        cc.fadeOut(animDurationSeconds), 
        cc.scaleTo(animDurationSeconds, 0.1)
      );
      this.node.runAction(spawn);
      // WARNING: The following `setTimeout` is used deliberately to avoid a case where `cc.callFunc` at the end of a `cc.sequence` is NOT called!
      setTimeout(() => {
        if(self.node){
          self.node.setScale(1);
        }
        self._closeWithoutDefaultAction();
      }, animDurationSeconds*1000);
    } else {
      cc.log(`CloseableDialog.onCloseClicked called without defaultActionsEnabled.`);
      this._closeWithoutDefaultAction();
    }
  },
});
