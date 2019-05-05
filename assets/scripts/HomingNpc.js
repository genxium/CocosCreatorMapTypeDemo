const BasePlayer = require("./BasePlayer");

window.HOMING_NPC_STATE = {
  STUCK: 1,
  MOVING_OUT: 2,
  MOVING_IN: 3, 
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
    const drawer = self.node.getChildByName("Drawer");
    drawer.parent = self.mapNode;
    drawer.setPosition(cc.v2(0, 0));
    setLocalZOrder(drawer, 20);
    let g = drawer.getComponent(cc.Graphics);
    g.lineWidth = 2;
    if (CC_DEBUG) {
      g.moveTo(self.node.position.x, self.node.position.y);
    }
    for (let i = 0; i < stops.length; ++i) {
      const stop = cc.v2(stops[i]);
      // Note that `stops[0]` is always `npcPlayerSrcContinuousPositionWrtMapNode`.
      if (i > 0) {
        const preStop = cc.v2(stops[i - 1]);
        ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / npcScriptIns.speed, stop));
      }

      if (i < stops.length - 1) {
        const nextStop = cc.v2(stops[i + 1]);
        const tmpVec = nextStop.sub(stop);
        const diffVec = {
          dx: tmpVec.x,
          dy: tmpVec.y,
        };

        const discretizedDirection = self.touchEventManagerScriptIns.discretizeDirection(diffVec.dx, diffVec.dy, self.touchEventManagerScriptIns.joyStickEps);

        if (CC_DEBUG) {
          g.lineTo(nextStop.x, nextStop.y);
          g.circle(nextStop.x, nextStop.y, 5);
        }
        ccSeqActArray.push(cc.callFunc(() => {
          npcScriptIns.scheduleNewDirection(discretizedDirection);
        }, npcScriptIns));
      }
    }
    if (CC_DEBUG) {
      g.stroke();
    }

    let reversedStops = [];
    for (let stop of stops) {
      reversedStops.push(stop);
    }
    reversedStops.reverse();

    for (let i = 0; i < reversedStops.length; ++i) {
      const stop = cc.v2(reversedStops[i]);
      if (i > 0) {
        const preStop = cc.v2(reversedStops[i - 1]);
        ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / npcScriptIns.speed, stop));
      }

      if (i < stops.length - 1) {
        const nextStop = cc.v2(reversedStops[i + 1]);
        const tmpVec = nextStop.sub(stop);
        const diffVec = {
          dx: tmpVec.x,
          dy: tmpVec.y,
        };

        const discretizedDirection = self.touchEventManagerScriptIns.discretizeDirection(diffVec.dx, diffVec.dy, self.touchEventManagerScriptIns.joyStickEps);
        ccSeqActArray.push(cc.callFunc(() => {
          npcScriptIns.scheduleNewDirection(discretizedDirection);
        }, npcScriptIns));
      }
    }

    ccSeqActArray.push(cc.callFunc(() => {
      if (cc.isValid(npcPlayerNode)) {
        drawer.getComponent(cc.Graphics).clear();
      }
    }));

    self.node.runAction(cc.repeatForever(cc.sequence(ccSeqActArray))); 
  },
});
