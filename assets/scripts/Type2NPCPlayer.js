const BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,
  properties: {
    uuidLabel: {
      type: cc.Label,
      default: null
    }
  },
  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
  },

  update(dt) {
    this.uuidLabel.string = this.node.uuid;
  },

});
