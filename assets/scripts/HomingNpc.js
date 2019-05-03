const BasePlayer = require("./BasePlayer");

module.export = cc.Class({
  extends: BasePlayer,

  properties: {
    grandSrc: {
      type: cc.v2,
      default: null
    },
    currentDestination: {
      type: cc.v2,
      default: null
    }
  },

  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.clips = {
      '01': 'FlatHeadSisterRunTop',
      '0-1': 'FlatHeadSisterRunBottom',
      '-20': 'FlatHeadSisterRunLeft',
      '20': 'FlatHeadSisterRunRight',
      '-21': 'FlatHeadSisterRunTopLeft',
      '21': 'FlatHeadSisterRunTopRight',
      '-2-1': 'FlatHeadSisterRunBottomLeft',
      '2-1': 'FlatHeadSisterRunBottomRight'
    };
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  },
});
