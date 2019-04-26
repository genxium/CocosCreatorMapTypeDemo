const COLLISION_WITH_PLAYER_STATE = {
  WALKING_COLLIDABLE: 0,
  STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM: 1,
  STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM: 2,
  STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM: 3,
  STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM: 4,
  STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM: 5,
  STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM: 6,
  WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER: 7,
  STILL_NEAR_NOBODY_PLAYING_ANIM: 8,
};

const STILL_NEAR_SELF_PLAYER_STATE_SET = new Set();
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);

const STILL_NEAR_OTHER_PLAYER_STATE_SET = new Set();
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);

const STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET = new Set();
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM);

function transitWalkingConditionallyCollidableToUnconditionallyCollidable(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;
  }

  return currentCollisionWithPlayerState;
}

function transitUponSelfPlayerLeftProximityArea(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  return currentCollisionWithPlayerState;
}

function transitDueToNoBodyInProximityArea(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  return currentCollisionWithPlayerState;
}

function transitToPlayingStunnedAnim(currentCollisionWithPlayerState, dueToSelfPlayer, dueToOtherPlayer) {
  if (dueToSelfPlayer) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE:
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM;
    }
  }

  if (dueToOtherPlayer) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;
    }
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitDuringPlayingStunnedAnim(currentCollisionWithPlayerState, dueToSelfPlayerComesIntoProximity, dueToOtherPlayerComesIntoProximity) {
  if (dueToSelfPlayerComesIntoProximity) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM;

      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM;
    }
  }

  if (dueToOtherPlayerComesIntoProximity) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM;

      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;
    }
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitStunnedAnimPlayingToPlayed(currentCollisionWithPlayerState, forceNotCollidableWithOtherPlayer) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
      return (true == forceNotCollidableWithOtherPlayer ? COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER : COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE);
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitStunnedAnimPlayedToWalking(currentCollisionWithPlayerState) {
  /*
  * Intentionally NOT transiting for 
  *
  * - STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM, or 
  * - STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM,
  *
  * which should be transited upon leaving of "SelfPlayer".
  */
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

const BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,

  properties: {
    birthPos: {
      default: null,
      type: cc.v2,
    }
  },

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
    this.scheduleNewDirection(this._generateRandomDirectionExcluding(0, 0));
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    const self = this;
    self.stuck = false;
    this.collisionWithPlayerState = COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;
    this.clips = {
      '01': 'TopLeft',
      '0-1': 'BottomRight',
      '-20': 'BottomLeft',
      '20': 'TopRight',
      '-21': 'TopLeft',
      '21': 'TopRight',
      '-2-1': 'BottomLeft',
      '2-1': 'BottomRight',
    };
    self.contactedRestaurants = [];

    self.onStunnedAnimPlayedSafe = () => {
      const oldCollisionWithPlayerState = self.collisionWithPlayerState;
      self.collisionWithPlayerState = transitStunnedAnimPlayingToPlayed(this.collisionWithPlayerState, true);
      if (oldCollisionWithPlayerState == self.collisionWithPlayerState || !self.node) return;

      // TODO: Be more specific with "toExcludeDx" and "toExcludeDy".
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(0, 0));
      self.collisionWithPlayerState = transitStunnedAnimPlayedToWalking(self.collisionWithPlayerState);
      setTimeout(() => {
        self.collisionWithPlayerState = transitWalkingConditionallyCollidableToUnconditionallyCollidable(self.collisionWithPlayerState);
      }, 5000);
    };

    self.onStunnedAnimPlayedSafeAction = cc.callFunc(self.onStunnedAnimPlayedSafe, self);
  },

  _canMoveBy(vecToMoveBy) {
    if (COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER != this.collisionWithPlayerState && COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE != this.collisionWithPlayerState) {
      return false;
    }
    const self = this;
    const superRet = BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);

    const computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);

    const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    let nextSelfColliderCircle = null;
    if (0 < self.contactedRestaurants.length) {
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
    return superRet;
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);
    const self = this;

    if (0 < self.contactedRestaurants.length || 0 < self.contactedBarriers.length) {
      const proposedNewDirection = self._generateRandomDirectionExcluding(0, 0);
      if (null == proposedNewDirection || (0 == proposedNewDirection.dx && 0 == proposedNewDirection.dy)) {
        self.stuck = true;
      } else {
        self.scheduleNewDirection(proposedNewDirection); 
      }
    }

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, self.computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(0, 0));
    }

    if (!self.stuck) {
      const vecToMoveBy = self._calculateVecToMoveBy(dt);
      if (self._canMoveBy(vecToMoveBy)) {
        self.node.position = self.computedNewDifferentPosLocalToParentWithinCurrentFrame;
      }
    } else {
      self._jumpOutOfStuck();
    }
  },

  _jumpOutOfStuck() {
    const self = this;
    cc.log(`Player node ${self.node.uuid} is stuck at ${self.node.position}.`); 
    for (let ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (!self.stuck) break;
      let lastJumpingDt = 1.0; /* seconds */
      let jumpingDt = 1.0; 
      let iterationCount = 0;
      let maxIterationCount = 20;
      while (iterationCount < maxIterationCount) {
        const vecToMoveBy = self._calculateVecToMoveBy(jumpingDt);
        const proposedPos = self.node.position.add(vecToMoveBy);
        if (tileCollisionManager.isOutOfMapNode(self.mapNode, proposedPos)) {
          const tmp = jumpingDt;
          jumpingDt = (lastJumpingDt + jumpingDt)*0.5; 
          lastJumpingDt = tmp;
        } else {
          if (self._canMoveBy(vecToMoveBy)) {
            self.node.position = proposedPos; 
            self.stuck = false; 
            cc.log(`Player node ${self.node.uuid} is de-stuck to ${self.node.position}.`); 
            break; 
          }
          lastJumpingDt = jumpingDt;
          jumpingDt = jumpingDt*2;
        }
        ++iterationCount;
      }
    }
    if (self.stuck) {
      self.node.position = self.birthPos; 
      self.stuck = false;
      cc.log(`Player node ${self.node.uuid} is de-stuck to birthPos ${self.node.position}.`); 
    }
  },

  _addContactedRestaurant(comp) {
    const self = this;
    for (let aComp of self.contactedRestaurants) {
      if (aComp.uuid == comp.uuid) {
        return false;
      }
    }
    self.contactedRestaurants.push(comp);
    return true;
  },

  _removeContactedRestaurant(comp) {
    const self = this;
    self.contactedRestaurants = self.contactedRestaurants.filter((aComp) => {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },

  onCollisionEnter(other, self) {
    BasePlayer.prototype.onCollisionEnter.call(this, other, self);
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "PolygonBoundaryRestaurant":
        playerScriptIns._addContactedRestaurant(other);
        break;
      default:
        break;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    BasePlayer.prototype.onCollisionExit.call(this, other, self);
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "PolygonBoundaryRestaurant":
        playerScriptIns._removeContactedRestaurant(other);
        break;
      default:
        break;
    }
  },

  setAnim(speciesName, cb) {
    const self = this;
    const dirPath = constants.PATROL_NPC_ANIM[speciesName].DIR_PATH;
    cc.loader.loadResDir(dirPath, cc.AnimationClip, function(err, animClips, urls) {
      if (null != err) {
        if (cb) {
          cb(false);
        }
        return;
      }
      if (!self.animComp) {
        self.animComp = self.node.getComponent(cc.Animation);
      }
      self.animComp._clips = animClips;
      if (cb) {
        cb(true);
      }
    });
  },
});
