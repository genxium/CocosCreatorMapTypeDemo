const BasePlayer = require("./BasePlayer");

window.HOMING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, 
  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,
};

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

  ctor() {
    this.state = HOMING_NPC_STATE.MOVING_OUT;      
    this.movementStops = null;
    this.drawer = null;
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

  refreshCurrentDestination() {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    const self = this;
    switch (self.state) {
      case window.HOMING_NPC_STATE.MOVING_IN:
      case window.HOMING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        self.currentDestination = self.grandSrc;
      break;
      case window.HOMING_NPC_STATE.MOVING_OUT:
      case window.HOMING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        self.currentDestination = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.grandSrc, 5);
      break;
      default:
      break;
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    const self = this;
    const npcBarrierCollider = self.node.getComponent(cc.CircleCollider);
    self.movementStops = window.findPathWithMapDiscretizingAStar(self.node.position, self.currentDestination, 0.01 /* Hardcoded temporarily */, npcBarrierCollider, self.mapIns.barrierColliders, null, self.mapNode);
    return self.movementStops;
  },

  restartPatrolling() {
    const self = this;
    self.node.stopAllActions();
    let ccSeqActArray = [];
    if (null == self.drawer) {
      self.drawer = self.node.getChildByName("Drawer");
      self.drawer.parent = self.mapNode;
    }
    const drawer = self.drawer;
    drawer.setPosition(cc.v2(0, 0));
    setLocalZOrder(drawer, 20);
    let g = drawer.getComponent(cc.Graphics);
    g.lineWidth = 2;
    if (CC_DEBUG) {
      g.moveTo(self.node.position.x, self.node.position.y);
    }
    const stops = self.movementStops;
    for (let i = 0; i < stops.length; ++i) {
      const stop = cc.v2(stops[i]);
      if (i > 0) {
        const preStop = cc.v2(stops[i - 1]);
        ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / self.speed, stop));
      }

      if (i < stops.length - 1) {
        const nextStop = cc.v2(stops[i + 1]);
        const tmpVec = nextStop.sub(stop);
        const diffVec = {
          dx: tmpVec.x,
          dy: tmpVec.y,
        };

        const discretizedDirection = self.mapIns.ctrl.discretizeDirection(diffVec.dx, diffVec.dy, self.mapIns.ctrl.joyStickEps);

        if (CC_DEBUG) {
          g.lineTo(nextStop.x, nextStop.y);
          g.circle(nextStop.x, nextStop.y, 5);
        }
        ccSeqActArray.push(cc.callFunc(() => {
          self.scheduleNewDirection(discretizedDirection);
        }, self));
      }
    }
    if (CC_DEBUG) {
      g.stroke();
    }

    ccSeqActArray.push(cc.callFunc(() => {
      if (cc.isValid(self.node)) {
        drawer.getComponent(cc.Graphics).clear();
      }

      switch (self.state) {
        case window.HOMING_NPC_STATE.MOVING_IN:
          self.state = window.HOMING_NPC_STATE.MOVING_OUT;
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        break;
        case window.HOMING_NPC_STATE.MOVING_OUT:
          self.state = window.HOMING_NPC_STATE.MOVING_IN;
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        break;
        default:
        break;
      } 
    }, self));

    self.node.runAction(cc.sequence(ccSeqActArray)); 
  },
});
