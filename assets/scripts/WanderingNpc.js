const BasePlayer = require("./BasePlayer");
const COMPOSITTE_ANIM_STATE_BIT = {
  NONE: 0,
  WALKING: (1 << 0),
  STOPPED: (1 << 1),
  EATING: (1 << 2),
  WINGS_UP: (1 << 3),
};

cc.Class({
  extends: BasePlayer,

  properties: {
    birthPos: {
      default: null,
      type: cc.v2,
    },
    walkingClips: {
      default: [],
      type: [cc.AnimationClip],
    },
    stoppedEatingClips: {
      default: [],
      type: [cc.AnimationClip],
    },
    maxDt: {
      default: (1.0 / 10), // Min fps required.
    }
  },

  addCompositeAnimStateBit(thatBit) {
    if (0 == (this.compositeAnimState & thatBit)) {
      this.compositeAnimState |= thatBit;
      return true;
    }
    return false;
  },
  
  removeCompositeAnimStateBit(thatBit) {
    if (0 < (this.compositeAnimState & thatBit)) {
      this.compositeAnimState &= ~thatBit;
      return true;
    }
    return false;
  },

  havingCompositeAnimStateBit(thatBit) {
    return (0 < (this.compositeAnimState & thatBit));
  },
    
  ctor() {
    this.compositeAnimState = COMPOSITTE_ANIM_STATE_BIT.NONE; 
    this.transInConf = {};
    this.transInConf[COMPOSITTE_ANIM_STATE_BIT.WALKING] = {
      probRange: [0, 0.8], // Meaning that when the random dice yields [0, 0.8) we should add `COMPOSITTE_ANIM_STATE_BIT.WALKING` and remove `COMPOSITTE_ANIM_STATE_BIT.STOPPED`. 
    };
    this.transInConf[COMPOSITTE_ANIM_STATE_BIT.STOPPED] = {
      probRange: [0.8, 1], // Meaning that when the random dice yields [0.8, 1.0) we should add `COMPOSITTE_ANIM_STATE_BIT.WALKING` and remove `COMPOSITTE_ANIM_STATE_BIT.STOPPED`. 
    };
    this.lastCompositeAnimStateUpdatedAt = null;
    this.compositeAnimStateUpdateIntervalMillis = 5000;
  }, 

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
    this.lastCompositeAnimStateUpdatedAt = Date.now();
    this.scheduleNewDirection(this._generateRandomDirectionExcluding(0, 0));
  },

  scheduleNewDirection(newScheduledDirection, forceAnimSwitch) {
    // Overriding that of `BasePlayer.prototype.scheduleNewDirection`.
    if (!newScheduledDirection || null == newScheduledDirection.dx || null == newScheduledDirection.dy) {
      return;
    }
    if (forceAnimSwitch || null == this.scheduledDirection || (newScheduledDirection.dx != this.scheduledDirection.dx || newScheduledDirection.dy != this.scheduledDirection.dy)) {
      this.scheduledDirection = newScheduledDirection;
      const clipKey = newScheduledDirection.dx.toString() + newScheduledDirection.dy.toString()
      if (!this.clips) {
        return; 
      }
      let clip = this.clips[clipKey];
      if (!clip) {
        // Keep playing the current anim.
        if (0 !== newScheduledDirection.dx || 0 !== newScheduledDirection.dy) {
          console.warn('Clip for clipKey === ' + clipKey + ' is invalid: ' + clip + '.');
        }
      } else {
        this.animComp.play(clip); 
      }
    }
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    const self = this;
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
    self.contactedRestaurants = [];
  },

  _canMoveBy(vecToMoveBy) {
    /*
     * Copies almost exactly what "BasePlayer._canMoveBy" does, except that we don't repect the GrandBoundaries here.
     *
     */
     
    const self = this;
    const computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);
    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = computedNewDifferentPosLocalToParentWithinCurrentFrame;

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      return false;
    }

    const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    let nextSelfColliderCircle = null;
    if ( 0 < self.contactedRestaurants.length || 0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length) {
      /* To avoid unexpected buckling. */
      const mutatedVecToMoveBy = vecToMoveBy.mul(2);
      nextSelfColliderCircle = {
        position: self.node.position.add(vecToMoveBy.mul(2)).add(
          currentSelfColliderCircle.offset
        ),
        radius: currentSelfColliderCircle.radius,
      };
    } else {
      nextSelfColliderCircle = {
        position: computedNewDifferentPosLocalToParentWithinCurrentFrame.add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius,
      };
    }

    for (let contactedRestaurant of self.contactedRestaurants) {
      let contactedBarrierPolygonLocalToParentWithinCurrentFrame = [];
      for (let p of contactedRestaurant.points) {
        contactedBarrierPolygonLocalToParentWithinCurrentFrame.push(contactedRestaurant.node.position.add(p));
      }
      if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        return false;
      }
    }
    for (let contactedBarrier of self.contactedBarriers) {
      let contactedBarrierPolygonLocalToParentWithinCurrentFrame = [];
      for (let p of contactedBarrier.points) {
        contactedBarrierPolygonLocalToParentWithinCurrentFrame.push(contactedBarrier.node.position.add(p));
      }
      if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        return false;
      }
    }

    return true;
  },

  _jumpOutOfStuck() {
    const self = this;
    if (self.stuck) {
      cc.log(`SelfPlayer node is stuck at ${self.node.position}.`);
      self.node.position = self.birthPos;
      self.stuck = false;
      cc.log(`WanderNpc node ${self.node.uuid} is de-stuck to birthPos ${self.node.position}.`);
    }
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);

    const self = this;

    if (dt <= self.maxDt) {
      /*
      * To save computational cost, you can comment out the immediately following block here.
      */
      if (0 < self.contactedRestaurants.length || 0 < self.contactedBarriers.length) {
        const proposedNewDirection = self._generateRandomDirectionExcluding(0, 0);
        if (null == proposedNewDirection || (0 == proposedNewDirection.dx && 0 == proposedNewDirection.dy)) {
          self.stuck = true;
        }
      }

      if (!self.stuck) {
        const vecToMoveBy = self._calculateVecToMoveBy(dt);
        if (self._canMoveBy(vecToMoveBy)) {
          self.node.position = self.computedNewDifferentPosLocalToParentWithinCurrentFrame;
        }
      } else {
        self._jumpOutOfStuck();
      }
    }

    if (0 < self.contactedRestaurants.length || 0 < self.contactedBarriers.length) {
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(self.scheduledDirection.dx, self.scheduledDirection.dy));
    }

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, self.computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(self.scheduledDirection.dx, self.scheduledDirection.dy));
    }

    if (null == self.lastCompositeAnimStateUpdatedAt) return;
    const now = Date.now();
    const elapsedMillis = (now - self.lastCompositeAnimStateUpdatedAt);
    if (elapsedMillis < self.compositeAnimStateUpdateIntervalMillis) return;
      
    const diceRes = Math.random();
    
    for (let key in this.transInConf) {
      const val = this.transInConf[key];
      if (
        diceRes < val.probRange[0]
        ||
        diceRes >= val.probRange[1]
      ) {
        continue;
      }

      const theBit = parseInt(key);
      if (this.havingCompositeAnimStateBit(theBit)) {
        // Not changed by the dice.
      } else {
        // Hardcoded for now.
        this.addCompositeAnimStateBit(theBit);
        switch (theBit) {
          case COMPOSITTE_ANIM_STATE_BIT.WALKING:
            this.removeCompositeAnimStateBit(COMPOSITTE_ANIM_STATE_BIT.STOPPED);
            this.node.removeComponent(cc.Animation);
            this.animComp = this.node.addComponent(cc.Animation);
            this.animComp._clips = this.walkingClips;
            this.animComp._defaultClip = this.animComp._clips[0];
            this.animComp.play();
            this.scheduleNewDirection(this._generateRandomDirectionExcluding(0, 0), true);
          break;
          case COMPOSITTE_ANIM_STATE_BIT.STOPPED:
            this.removeCompositeAnimStateBit(COMPOSITTE_ANIM_STATE_BIT.WALKING);
            this.node.removeComponent(cc.Animation);
            this.animComp = this.node.addComponent(cc.Animation);
            this.animComp._clips = this.stoppedEatingClips;
            this.animComp._defaultClip = this.animComp._clips[0];
            this.animComp.play();
            this.scheduleNewDirection({dx: 0, dy: 0}, true);
          break;
          default: 
          break;
        }
      } 
      break;
    }
    self.lastCompositeAnimStateUpdatedAt = now;  
  },

  setAnim(speciesName, cb) {
    const self = this;
    const walkingDirPath = constants.WANDERING_NPC_ANIM[speciesName].WALKING;
    cc.loader.loadResDir(walkingDirPath, cc.AnimationClip, function(err, animClips, urls) {
      if (null != err) {
        cc.warn(err);
      }
      if (!self.animComp) {
        self.animComp = self.node.getComponent(cc.Animation);
      }
      self.walkingClips = animClips;
			//walkingClips为默认初始化的_clips
			const animComp = self.node.getComponent(cc.Animation);
			animComp._clips = self.walkingClips;
      const stopDirPath = constants.WANDERING_NPC_ANIM[speciesName].STOPPED;
      cc.loader.loadResDir(stopDirPath, cc.AnimationClip, function(err, animClips, urls) {
        if (null != err) {
          if (cb) {
            cb(false);
          }
          cc.warn(err);
          return;
        }
        if (!self.animComp) {
          self.animComp = self.node.getComponent(cc.Animation);
        }
        self.stoppedEatingClips = animClips;
        if (cb) {
          cb(true);
        }
      });
    });
  },
});
