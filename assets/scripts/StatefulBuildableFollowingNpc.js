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
    speciesName: {
      default: "DUCK",
    },
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
    },
    boundStatefulBuildable: {
      // It's a pointer to an instance of class "StatefulBuildableInstance" a.k.a. a "cc.Component class script instance".
      type: Object,
      default: null,
    },
  },

  ctor() {
    this.state = STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
    this.movementStops = null;
    this.drawer = null;
    this.stayingAnimClips = null;
    this.walkingAnimClips = null;
  },

  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    const self = this;
    /*
    * Deliberately NOT calling "BasePlayer.prototype.onLoad".
    *
    * The class "BasePlayer" switches to play the "appropriate `cc.AnimationClip` of `scheduledDirection` within `this.clips`" when "scheduleNewDirection" is called. 
    * 
    * To switch "cc.Animation", the "this.animComp" will be tuned to point to appropriate objects.
    *
    * -- YFLu
    */

    self.clips = {
      '01': 'TopRight',
      '0-1': 'BottomLeft',
      '-20': 'TopLeft',
      '20': 'BottomRight',
      '-21': 'TopLeft',
      '21': 'TopRight',
      '-2-1': 'BottomLeft',
      '2-1': 'BottomRight'
    };
    self.setAnim(self.speciesName, () => {
      self.scheduleNewDirection(self._generateRandomDirection());
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self.animComp.play(clipKey);
    });
  },

  transitToStaying() {
    const self = this;
    // Don't execute the calculation of "continuous -> discrete coordinate" before checking the current state.
    let discretizedSelfNodePos = null;
    let discretizedDestinaion = null;

    switch (this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestinaion.x && discretizedSelfNodePos.y == discretizedDestinaion.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN;
        }
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        discretizedSelfNodePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        if (discretizedSelfNodePos.x == discretizedDestinaion.x && discretizedSelfNodePos.y == discretizedDestinaion.y) {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT;
        } else {
          this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT;
        }
        break;
      default:
        break;
    }

    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self.animComp.play();
    });
  },

  transitToStuck() {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT;
        break;
      default:
        break;
    }

    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self.animComp.play();
    });
  },

  transitToMoving() {
    const self = this;
    switch (this.state) {
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_IN:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
        this.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT;
        break;
      default:
        break;
    }
    self.setAnim(self.speciesName, () => {
      const clipKey = self.clips[self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString()];
      self.animComp.play();
    });
  },

  refreshGrandSrcAndCurrentDestination() {
    const self = this;
    self.preGrandSrc = self.grandSrc;
    self.grandSrc = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset); // Temporarily NOT seeing the "barrier grids occupied by `boundStatefulBuildable`" as a barrier to its own following NPCs. -- YFLu

    self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN; 
    self.refreshCurrentDestination();
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
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_IN:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_OUT:
        if (null != self.currentDestination) {
          previousDiscretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        }

        self.currentDestination = self.grandSrc;
        discretizedDestinaion = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentDestination, cc.v2(0, 0));
        break;
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STUCK_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_WHILE_MOVING_OUT:
      case window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN:
        // Deliberately left blank. -- YFLu
        break;
      default:
        break;
    }

    if (null != previousDiscretizedDestinaion) {
      let previousStatefulBuildableFollowingNpcDestinationDictRecord = null;
      if (null != window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x]) {
        previousStatefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
      }
      if (null != previousStatefulBuildableFollowingNpcDestinationDictRecord && null != previousStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid]) {
        delete previousStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid];
        // Lazy clearance.
        if (0 >= Object.keys(previousStatefulBuildableFollowingNpcDestinationDictRecord).length) {
          window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y] = null;
          delete window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x][previousDiscretizedDestinaion.y];
          if (0 >= Object.keys(window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x]).length) {
            window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x] = null;
            delete window.reverseStatefulBuildableFollowingNpcDestinationDict[previousDiscretizedDestinaion.x];
          }
        }
      }
    }

    if (null != discretizedDestinaion) {
      let reverseStatefulBuildableFollowingNpcDestinationDictRecord = null;
      // Lazy init.
      if (null == window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestinaion.x]) {
        window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestinaion.x] = {};
      }
      if (null == window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y]) {
        window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y] = {};
      }

      reverseStatefulBuildableFollowingNpcDestinationDictRecord = window.reverseStatefulBuildableFollowingNpcDestinationDict[discretizedDestinaion.x][discretizedDestinaion.y];
      reverseStatefulBuildableFollowingNpcDestinationDictRecord[self.node.uuid] = self;
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    const self = this;
    if (null == self.currentDestination) {
      self.movementStops = null;
    } else {
      const npcBarrierCollider = self.node.getComponent(cc.CircleCollider);
      let discreteBarrierGridsToIgnore = {};
      const discreteWidth = self.boundStatefulBuildable.discreteWidth;
      const discreteHeight = self.boundStatefulBuildable.discreteHeight;
      const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.boundStatefulBuildable.node.position.add(self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));

      for (let discreteX = anchorTileDiscretePos.x; discreteX < (anchorTileDiscretePos.x + discreteWidth); ++discreteX) {
        if (null == discreteBarrierGridsToIgnore[discreteX]) {
          discreteBarrierGridsToIgnore[discreteX] = {};
        }
        for (let discreteY = anchorTileDiscretePos.y; discreteY < (anchorTileDiscretePos.y + discreteHeight); ++discreteY) {
          discreteBarrierGridsToIgnore[discreteX][discreteY] = true;
        }  
      }  
      
      self.movementStops = window.findPathWithMapDiscretizingAStar(self.node.position, self.currentDestination, 0.01 /* Hardcoded temporarily */ , npcBarrierCollider, self.mapIns.barrierColliders, null, self.mapNode, null, discreteBarrierGridsToIgnore);
    }
    console.log("For statefulBuildableFollowingNpcComp.uuid == ", self.uuid, ", found steps from ", self.node.position, " to ", self.currentDestination, " :", self.movementStops);

    return self.movementStops;
  },

  restartPatrolling() {
    const self = this;
    const actualExecution = () => {
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
      g.strokeColor = cc.Color.WHITE;
      if (CC_DEBUG) {
        g.clear();
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
        if (CC_DEBUG) {
          g.clear();
        }
        self.transitToStaying();
      }, self));

      self.node.runAction(cc.sequence(ccSeqActArray));
    };
    if (null == self.animComp._clips || 0 >= self.animComp._clips.length) {
      self.setAnim(self.speciesName, actualExecution);
    } else {
      actualExecution();
    }
  },

  onCollisionEnter(otherCollider, selfCollider) {
    BasePlayer.prototype.onCollisionEnter.call(this, otherCollider, selfCollider);
    const self = this.getComponent(this.node.name);
    switch (otherCollider.node.name) {
      case "PolygonBoundaryBarrier":
        let collidingWithAssociatedStatefulBuildable = false;
        const boundStatefulBuildableOfCollider = otherCollider.boundStatefulBuildable; 
        collidingWithAssociatedStatefulBuildable = (null != boundStatefulBuildableOfCollider && (boundStatefulBuildableOfCollider.uuid == self.boundStatefulBuildable.uuid));
        if (collidingWithAssociatedStatefulBuildable) {
          return;
        }
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

  setAnim(speciesName, cb) {
    const self = this;
    let dirPath = null;

    if (!self.animComp) {
      self.animComp = self.node.getComponent(cc.Animation);
    }
    switch (self.state) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        if (null != self.walkingAnimClips) {
          if (cb) {
            cb(false);
          }
          return;
        }
        dirPath = constants.NPC_ANIM[speciesName].WALKING;
        break;
      default:
        if (null != self.stayingAnimClips) {
          if (cb) {
            cb(false);
          }
          return;
        }
        dirPath = constants.NPC_ANIM[speciesName].STAYING;
        break;
    }

    cc.loader.loadResDir(dirPath, cc.AnimationClip, function(err, animClips, urls) {
      if (null != err) {
        cc.warn(err);
      }
      self.animComp._clips = animClips;
      switch (self.state) {
        case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
          self.walkingAnimClips = animClips;
          break;
        default:
          self.stayingAnimClips = animClips;
          break;
      }
      if (cb) {
        cb(true);
      }
    });
  },
});
