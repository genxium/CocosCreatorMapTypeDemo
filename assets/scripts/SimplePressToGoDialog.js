const CloseableDialog = require('./CloseableDialog');

cc.Class({
  extends: CloseableDialog,
  properties: {
    hintLabel: {
      type: cc.Label,
      default: null
    },
    yesButtonLabel: {
      type: cc.Label,
      default: null
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },

  setHintLabel(str) {
    this.hintLabel.string = str;
  },

  setYesButtonLabel(str) {
    this.yesButtonLabel.string = str;
  },

});
