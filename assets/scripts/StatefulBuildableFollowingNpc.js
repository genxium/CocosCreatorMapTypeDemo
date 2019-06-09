const BasePlayer = require("./BasePlayer");

window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE = {
  MOVING_OUT: 1,
  MOVING_IN: 2, // This state will be active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where an available "NewGrandSrc" can be found.
  STUCK_WHILE_MOVING_OUT: 3,
  STUCK_WHILE_MOVING_IN: 4,
  STUCK_NO_AVAILABLE_GRAND_SRC: 5, // This state is only active when "boundStatefulBuildable" is moved to a new "fixedSpriteCentreContinuousPos" where NO AVAILABLE "NewGrandSrc" can be found, in such case it could yield "grandSrc == null && preGrandSrc != null".
  STAYING_WHILE_MOVING_OUT: 8,
  STAYING_WHILE_MOVING_IN: 9,
  STAYING_AT_DESTINATION_AFTER_MOVING_OUT: 10,
  STAYING_AT_DESTINATION_AFTER_MOVING_IN: 11, // A.k.a. staying at "grandSrc".
};

module.export = cc.Class({
  extends: BasePlayer,
    
  properties: {
    preGrandSrc: {
      type: cc.v2,
      default: null
    },
    grandSrc: {
      type: cc.v2,
      default: null
    },
    currentDestination: {
      type: cc.v2,
      default: null
    }
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
    this.state = STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
    this.movementStops = null;
    this.drawer = null;
  },

  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() { 
    const self = this;
    self.stayingAnimComp = this.stayingAnimNode.getComponent(cc.Animation);
    self.walkingAnimComp = this.walkingAnimNode.getComponent(cc.Animation);
    /*
    * Deliberately NOT calling "BasePlayer.prototype.onLoad".
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

  transitToStaying() {
    const self = this;
    let discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
    let discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));

    switch(this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        if (discretizedSelfNodePos.x == discretizedDestinaion.x && discretizedSelfNodePos.y == discretizedDestinaion.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN; 
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN; 
        }
      break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        if (discretizedSelfNodePos.x == discretizedDestinaion.x && discretizedSelfNodePos.y == discretizedDestinaion.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT; 
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT; 
        }
      break;
      default:
      break;
    }
  },

  transitToStuck() {
    switch(this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN; 
      break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT; 
      break;
      default:
      break;
    }
  },

  transitToMoving() {
    switch(this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN; 
      break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT; 
      break;
    }
  },

  refreshGrandSrc() {
    // TBD.
  },

  refreshCurrentDestination() {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    let previousDiscretizedDestinaion = null;
    let discretizedDestinaion = null;
    const self = this;
    self.node.stopAllActions();
    switch (self.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }

        self.currentDestination = self.grandSrc;
        discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
      break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }

        self.currentDestination = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.grandSrc, 5);
        if (null == self.currentDestination) {
          self.transitToStuck();  
        } else {
          discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }
      break;
      default:
      break;
    }
    if (null != previousDiscretizedDestinaion) {
      let previousReverseHomingNpcDestinationDictRecord = null;
      if (null != window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x]) {
        previousReverseHomingNpcDestinationDictRecord = window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
      }
      if (null != previousReverseHomingNpcDestinationDictRecord && null != previousReverseHomingNpcDestinationDictRecord[self.node.uuid]) {
        delete previousReverseHomingNpcDestinationDictRecord[self.node.uuid];
        // Lazy clearance.
        if (0 >= Object.keys(previousReverseHomingNpcDestinationDictRecord).length) {
          window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y] = null;
          delete window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y]; 
          if (0 >= Object.keys(window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x]).length) {
            window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x] = null;
            delete window.reverseHomingNpcDestinationDict[previousDiscretizedDestinaion.x]; 
          }
        } 
      }
    }

    if (null != discretizedDestinaion) {
      let reverseHomingNpcDestinationDictRecord = null;
      // Lazy init.
      if (null == window.reverseHomingNpcDestinationDict[discretizedDestinaion.x]) {
        window.reverseHomingNpcDestinationDict[discretizedDestinaion.x] = {};
      } 
      if (null == window.reverseHomingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y]) {
        window.reverseHomingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y] = {};
      }

      reverseHomingNpcDestinationDictRecord = window.reverseHomingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y]; 
      reverseHomingNpcDestinationDictRecord[self.node.uuid] = self;
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    const self = this;
    if (null == self.currentDestination) {
      self.movementStops = null;
    } else {
      const npcBarrierCollider = self.node.getComponent(cc.CircleCollider);
      self.movementStops = window.findPathWithMapDiscretizingAStar(self.node.position, self.currentDestination, 0.01 /* Hardcoded temporarily */, npcBarrierCollider, self.mapIns.barrierColliders, null, self.mapNode);
    }
    return self.movementStops;
  },

  restartPatrolling() {
    const self = this;
    self.node.stopAllActions();
    const stops = self.movementStops;
    if (null == stops || 0 >= stops.length) {
      return;
    }
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
    for (let i = 0; i < stops.length; ++i) {
      const stop = cc.v2(stops[i]);
      if (i > 0) {
        const preStop = cc.v2(stops[i - 1]);
        ccSeqActArray.push(cc.moveTo(stop.sub(preStop).mag() / self.speed, stop));
      } else {
        const preStop = self.node.position;
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
        case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
          self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT;
          self.refreshCurrentDestination();
          self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
          self.restartPatrolling();
        break;
        case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
          self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
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

  onCollisionEnter(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        self.node.stopAllActions();
        const availableNewPositionNearby = window.findNearbyNonBarrierGridByBreathFirstSearch(self.mapNode, self.node.position, 1);
        if (null == availableNewPositionNearby) {
          self.currentDestination = self.grandSrc;
          self.node.setPosition(self.grandSrc);  
          self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          self.node.setPosition(availableNewPositionNearby);  
        }
        self.refreshCurrentDestination();
        self.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        self.restartPatrolling();
        break;
      default:
        break;
    }
  },

  onCollisionStay(otherCollider, selfCollider) {
    // TBD.
  },

  onCollisionExit(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        // Deliberatly not handling. -- YFLu
        break;
      default:
        break;
    }
  },
});
