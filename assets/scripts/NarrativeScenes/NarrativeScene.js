module.exports = cc.Class({
  extends: cc.Component,

  properties: {
    maskLayer: {
      type: cc.Node,
      default: null
    },
    transitButton: {
      type: cc.Button,
      default: null
    },
    statement: {
      type: cc.Label,
      default: null
    },
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
    // TODO
  },
});

