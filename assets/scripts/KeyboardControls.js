cc.Class({
  extends: cc.Component,

  properties: {},

  setInputControls: function() {
    const self = this;
    // add keyboard event listener
    // When there is a key being pressed down, judge if it's the designated directional button and set up acceleration in the corresponding direction
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, function(event) {
      switch (event.keyCode) {
        case cc.macro.KEY.w:
          self.activeDirection.dy = +1.0;
          break;
        case cc.macro.KEY.s:
          self.activeDirection.dy = -1.0;
          break;
        case cc.macro.KEY.a:
          self.activeDirection.dx = -2.0;
          break;
        case cc.macro.KEY.d:
          self.activeDirection.dx = +2.0;
          break;
        default:
          break;
      }
    }, self.node);

    // when releasing the button, stop acceleration in this direction
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, function(event) {
      switch (event.keyCode) {
        case cc.macro.KEY.w:
          if (+1.0 == self.activeDirection.dy) {
            self.activeDirection.dy = 0.0;
          }
          break;
        case cc.macro.KEY.s:
          if (-1.0 == self.activeDirection.dy) {
            self.activeDirection.dy = 0.0;
          }
          break;
        case cc.macro.KEY.a:
          if (-2.0 == self.activeDirection.dx) {
            self.activeDirection.dx = 0.0;
          }
          break;
        case cc.macro.KEY.d:
          if (+2.0 == self.activeDirection.dx) {
            self.activeDirection.dx = 0.0;
          }
          break;
        default:
          break;
      }
    }, self.node);
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    // Properties deliberately hidden from GUI panel.
    this.activeDirection = {
      dy: 0.0,
      dx: 0.0
    };
    this.setInputControls();
  }
});

