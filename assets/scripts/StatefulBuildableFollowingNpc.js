const HomingNpc = require("./HomingNpc");

window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, 
  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,
  STUCK_NO_AVAILABLE_GRAND_SRC: 5, // This state is only active when "boundStatefulBuildable" is moved to a spot where no adjacent grid is available as the "NewGrandSrc".
  MOVING_TO_NEW_GRAND_SRC: 6,
  STUCK_WHILE_MOVING_TO_NEW_GRAND_SRC: 7,
  STAYING: 8,
};

module.export = cc.Class({
  extends: HomingNpc,
    
  properties: {
    boundStatefulBuildable: {
      type: Object,
      default: null, 
    },
    stayingAnimNode: {
      type: cc.Node,
      default: null, 
    },
    walkingAnimNode: {
      type: cc.Node,
      default: null, 
    },
  },

  ctor() {
    this.state = STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING;
    this.movementStops = null;
    this.drawer = null;
  },

  start() {
    HomingNpc.prototype.start.call(this);
  },

  onLoad() { 
    const self = this;
    self.stayingAnimComp = this.stayingAnimNode.getComponent(cc.Animation);
    self.walkingAnimComp = this.walkingAnimNode.getComponent(cc.Animation);
    /*
    * Deliberately NOT calling "HomingNpc.prototype.onLoad" or "BasePlayer.prototype.onLoad".
    *
    * The class "BasePlayer" switches to play the "appropriate `cc.AnimationClip` of `scheduledDirection` within `this.clips`" when "scheduleNewDirection" is called. 
    * 
    * To switch "cc.Animation", the "this.animComp" will be tuned to point to appropriate objects.
    *
    * -- YFLu
    */
    self.animComp = self.stayingAnimComp;
    self.animComp.play();
  },
});
