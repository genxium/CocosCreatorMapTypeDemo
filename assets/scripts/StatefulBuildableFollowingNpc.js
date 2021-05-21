const BasePlayer = require("./BasePlayer");
const PriorityQueue = require("./PriorityQueue"); // By default a MinHeap w.r.t. its "Node.key"

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
    walkingAnimNode: {
      type: cc.Node,
      default: null
    },
    stayingAnimNode: {
      type: cc.Node,
      default: null
    },
    uuidLabel: {
      type: cc.Label,
      default: null
    },
    cacheCollectionNode: {
      type: cc.Node,
      default: null
    },
  },

  ctor() {
    this.clips = {
      '01': 'TopRight',
      '0-1': 'BottomLeft',
      '-20': 'TopLeft',
      '20': 'BottomRight',
      '-21': 'TopLeft',
      '21': 'TopRight',
      '-2-1': 'BottomLeft',
      '2-1': 'BottomRight'
    };
    this.state = STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.STAYING_AT_DESTINATION_AFTER_MOVING_IN;
    this.drawer = null;

    this.boundStatefulBuildable = null; // It's a pointer to an instance of class "StatefulBuildableInstance" a.k.a. a "cc.Component class script instance".
    this.preGrandSrc = null;
    this.grandSrc = null;

    // At any instant, "self.node.position" should be moving towards "self.currentSrc", if not already arrived.
    this.currentSrc = null; // continuous
    this.currentDestination = null; // continuous

    this.discreteBarrierGridsToIgnore = null;

    this.movementStops = null;

    // Caches for "D* Lite" algorithms, see http://idm-lab.org/bib/abstracts/papers/aaai02b.pdf. [BEGINS]
    this.discreteCurrentSrc = null; // corresponds to "D* Lite" paper "S_{start}". 
    this.discreteCurrentDestination = null;
    this.pqForPathFinding = null;
    this.rhsCache = null;
    this.gCache = null;
    this.km = null;

    this.discreteLastSrc = null; // corresponds to "D* Lite" paper "S_{last}". 
    // [ENDS]

  },
  
  _cost(p1 /* discrete, from */, p2 /* discrete, to */) {
    const p1IsBarrier = (null != window.cachedKnownBarrierGridDict[p1.x] && true == window.cachedKnownBarrierGridDict[p1.x][p1.y]);
    const p1BarrierIsIgnored = (null != this.discreteBarrierGridsToIgnore && null != this.discreteBarrierGridsToIgnore[p1.x] && true == this.discreteBarrierGridsToIgnore[p1.x][p1.y]);

    if (p1IsBarrier && false == p1BarrierIsIgnored) {
      return Infinity;
    }

    const p2IsBarrier = (null != window.cachedKnownBarrierGridDict[p2.x] && true == window.cachedKnownBarrierGridDict[p2.x][p2.y]);
    const p2BarrierIsIgnored = (null != this.discreteBarrierGridsToIgnore && null != this.discreteBarrierGridsToIgnore[p2.x] && true == this.discreteBarrierGridsToIgnore[p2.x][p2.y]);
    if (p2IsBarrier && false == p2BarrierIsIgnored) {
      return Infinity;
    }
    
    const self = this;

    const dx = (p2.x - p1.x);
    const dy = (p2.y - p1.y);     

    const dt = 0.0166666667; // default to predict 1/60 second
    const vecToMoveBy = this._calculateVecToMoveByInDir(dt, cc.v2(dx, dy)); 

    if (false == self._canMoveBy(vecToMoveBy)) {
      /*
      This call to "_canMoveBy(...)" could be expensive (in terms of spacetime complexity), yet it's to avoid maintaining the moving barriers in vision for EACH player, when every other player is moving. 

      The time complexity will be reduced by the current approach if the collision occurrence of players is sparse in space.  
      */
      return Infinity;
    }

    return Math.abs(dx) + Math.abs(dy);
  },

  _heuristicallyEstimatePathLength(p1, p2) {
    return this._cost(p1, p2);
  },

  start() {
    BasePlayer.prototype.start.call(this);
  },
    
  _neighbourOffsetToMemberVarName(neighbourOffset) {
    return ("_" + neighbourOffset.dx + "_" + neighbourOffset.dy + "_").replace("+", "plus").replace("-", "minus");
  },

  _cacheValueToString(g, gAndHSum) {
    return "(" + g + ", " + gAndHSum.toFixed(1) + ")";
  },

  _initCacheCollectionLabels() {
    const self = this;
    self.uuidLabel.string = self.node.uuid;
    const discreteCurrentPos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
    
    for (let neighbourOffset of window.NEIGHBOUR_DISCRETE_OFFSETS) {
      const discreteNeighbourPos = {
        x: discreteCurrentPos.x + neighbourOffset.dx,
        y: discreteCurrentPos.y + neighbourOffset.dy,
      };

      const continuousPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapNode, self.mapIns.tiledMapIns, null, discreteNeighbourPos.x, discreteNeighbourPos.y);

      const continuousDiffVecInSelfNode = continuousPtInMapNode.sub(self.node.position);
      const theMemberVarName = self._neighbourOffsetToMemberVarName(neighbourOffset);
      const theLabelNode = new cc.Node(theMemberVarName); 
      const theLabel = theLabelNode.addComponent(cc.Label); 
      theLabel.string = theMemberVarName;

      theLabelNode.setPosition(continuousDiffVecInSelfNode);
      setLocalZOrder(theLabelNode, CORE_LAYER_Z_INDEX.DRAGGING_ITEM);
      self[theMemberVarName] = theLabel;
      safelyAddChild(self.cacheCollectionNode, theLabelNode);
    }

    const continuousPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapNode, self.mapIns.tiledMapIns, null, discreteCurrentPos.x, discreteCurrentPos.y);
    const continuousDiffVecInSelfNode = continuousPtInMapNode.sub(self.node.position);
    const theMemberVarName = self._neighbourOffsetToMemberVarName({dx: 0, dy: 0});
    const theLabelNode = new cc.Node(theMemberVarName); 
    const theLabel = theLabelNode.addComponent(cc.Label); 
    theLabel.string = theMemberVarName;

    theLabelNode.setPosition(continuousDiffVecInSelfNode);
    setLocalZOrder(theLabelNode, CORE_LAYER_Z_INDEX.DRAGGING_ITEM);
    self[theMemberVarName] = theLabel;
    safelyAddChild(self.cacheCollectionNode, theLabelNode);
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

    self._initCacheCollectionLabels();
    self.setAnim(self.speciesName, () => {
      self.scheduleNewDirection(self._generateRandomDirection());
      self.transitToStaying(() => {
        // Deliberately left blank. -- YFLu
      });
    });
  },

  transitToStaying(cb) {
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
      self.animComp.play(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  transitToStuck(cb) {
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
      self.animComp.play(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  transitToMoving(cb) {
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
      self.animComp.play(clipKey);
      if (cb) {
        cb();
      }
    });
  },

  refreshGrandSrcAndCurrentDestination() {
    const self = this;
    self.preGrandSrc = self.grandSrc;
    self.grandSrc = self.boundStatefulBuildable.fixedSpriteCentreContinuousPos.add(self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset); // Temporarily NOT seeing the "barrier grids occupied by `boundStatefulBuildable`" as a barrier to its own following NPCs. -- YFLu

    /*
     * The change of `grandSrc` implies a change of `discreteBarrierGridsToIgnore`.
     */
    self.discreteBarrierGridsToIgnore = {};
    const discreteWidth = self.boundStatefulBuildable.discreteWidth;
    const discreteHeight = self.boundStatefulBuildable.discreteHeight;

    const anchorTileDiscretePos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.boundStatefulBuildable.node.position.add(self.boundStatefulBuildable.estimatedSpriteCentreToAnchorTileCentreContinuousOffset), cc.v2(0, 0));


    for (let discreteX = anchorTileDiscretePos.x; discreteX < (anchorTileDiscretePos.x + discreteWidth); ++discreteX) {
      if (null == self.discreteBarrierGridsToIgnore[discreteX]) {
        self.discreteBarrierGridsToIgnore[discreteX] = {};
      }
      for (let discreteY = anchorTileDiscretePos.y; discreteY < (anchorTileDiscretePos.y + discreteHeight); ++discreteY) {
        self.discreteBarrierGridsToIgnore[discreteX][discreteY] = true;
      }
    }

    self.currentSrc = self.node.position;
    self.discreteCurrentSrc = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.currentSrc, cc.v2(0, 0));
    self.discreteLastSrc = self.discreteCurrentSrc; 

    self.state = window.STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN;
    self.refreshCurrentDestination();

    self._initPathFindingCaches();
    self.computePathFindingCaches();
  },

  refreshCurrentDestination() {
    /**
    * WARNING: You should update `this.state` before calling this method. 
    */
    let previousDiscretizedDestinaion = null;
    let discretizedDestinaion = null;
    const self = this;
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
        self.discreteCurrentDestination = discretizedDestinaion;
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

  setAnim(speciesName, cb) {
    const self = this;
    let dirPath = null;

    const selfStateWhenCalled = self.state;

    switch (selfStateWhenCalled) {
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
      case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
        if (null != self.walkingAnimComp) {
          self.stayingAnimNode.active = false;
          self.walkingAnimNode.active = true;
          self.animComp = self.walkingAnimComp;
          if (cb) {
            cb(false);
          }
          return;
        }
        dirPath = constants.NPC_ANIM[speciesName].WALKING;
        break;
      default:
        if (null != self.stayingAnimComp) {
          self.walkingAnimNode.active = false;
          self.stayingAnimNode.active = true;
          self.animComp = self.stayingAnimComp;
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
      switch (selfStateWhenCalled) {
        case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_OUT:
        case STATEFUL_BUILDABLE_FOLLOWING_NPC_STATE.MOVING_IN:
          const walkingAnimComp = self.walkingAnimNode.getComponent(cc.Animation);
          for (let clip of animClips) {
            walkingAnimComp.addClip(clip);
          }
          self.walkingAnimComp = walkingAnimComp;
          self.animComp = walkingAnimComp;
          self.stayingAnimNode.active = false;
          self.walkingAnimNode.active = true;
          break;
        default:
          const stayingAnimComp = self.stayingAnimNode.getComponent(cc.Animation);
          for (let clip of animClips) {
            stayingAnimComp.addClip(clip);
          }
          self.stayingAnimComp = stayingAnimComp;
          self.animComp = stayingAnimComp;
          self.walkingAnimNode.active = false;
          self.stayingAnimNode.active = true;
          break;
      }
      if (cb) {
        cb(true);
      }
    });
  },

  _keyCompare(aKey, bKey) {
      if (aKey[0] != bKey[0]) return aKey[0] - bKey[0]; 
      return aKey[1] - bKey[1];
  },

  _calculatePriorityPair(discretePos) {
    // Corresponds to "D* Lite" paper "CalculateKey(s)" part.
    const discretePosKey = window.describe(discretePos);
    const minOfGAndRhs = Math.min(this.rhsCache[discretePosKey], this.gCache[discretePosKey]);
    return [minOfGAndRhs + this._heuristicallyEstimatePathLength(this.discreteCurrentSrc, discretePos) + this.km, minOfGAndRhs];
  },

  _initPathFindingCaches() {
    // Corresponds to "D* Lite" paper "Initialize()" part.
    const self = this;

    const tiledMapIns = self.mapIns.tiledMapIns;
    const mapSizeDiscrete = tiledMapIns.getMapSize();

    const uniformDiscreteMargin = 0;
    self.km = 0;
    self.gCache = {};
    self.rhsCache = {};
    for (let discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
      for (let discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
        const discreteNeighbourPosKey = window.describe({
          x: discretePosXInMap,
          y: discretePosYInMap
        });
        self.gCache[discreteNeighbourPosKey] = Infinity;
        self.rhsCache[discreteNeighbourPosKey] = Infinity;
      }
    }

    const discreteCurrentDestinationKey = window.describe(self.discreteCurrentDestination);
    self.rhsCache[discreteCurrentDestinationKey] = 0;

    self.pqForPathFinding = new PriorityQueue(function (a, b) {
      return self._keyCompare(a.key, b.key);
    });

    self.pqForPathFinding.push(
      self._calculatePriorityPair(self.discreteCurrentDestination), 
      self.discreteCurrentDestination,
      discreteCurrentDestinationKey
    );
  },

  _onVertexUpdated(discretePos) {
    const self = this;
    // Corresponds to "D* Lite" paper "UpdateVertex(u)" part.
    const discretePosKey = window.describe(discretePos);
    const tiledMapIns = self.mapIns.tiledMapIns;
    const mapSizeDiscrete = tiledMapIns.getMapSize();

    if (discretePos.x != self.discreteCurrentDestination.x || discretePos.y != self.discreteCurrentDestination.y) {
      self.rhsCache[discretePosKey] = Infinity; 
      for (let neighbourOffset of window.NEIGHBOUR_DISCRETE_OFFSETS) {
        const discreteNeighbourPos = {
          x: discretePos.x + neighbourOffset.dx,
          y: discretePos.y + neighbourOffset.dy,
        };

        if (discreteNeighbourPos.x < 0
          ||
          discreteNeighbourPos.x >= mapSizeDiscrete.width
          ||
          discreteNeighbourPos.y < 0
          ||
          discreteNeighbourPos.y >= mapSizeDiscrete.height
        ) {
          continue;
        }
        const discreteNeighbourPosKey = window.describe(discreteNeighbourPos);
        const candidateGValue = self.gCache[discreteNeighbourPosKey];
        const candidateRhsValue = (candidateGValue + self._cost(discreteNeighbourPos, discretePos));

        if (candidateRhsValue < this.rhsCache[discretePosKey]) this.rhsCache[discretePosKey] = candidateRhsValue;  
      }
    }

    const newPriority = self._calculatePriorityPair(discretePos);
    if (Infinity == newPriority[0]) {
      return;
    }

    if (self.pqForPathFinding.contains(discretePosKey)) {
      self.pqForPathFinding.removeAny(discretePosKey);
    } 
    if (self.gCache[discretePosKey] != self.rhsCache[discretePosKey]) {
      self.pqForPathFinding.push(newPriority, discretePos, discretePosKey);
    }
  },

  onCostChanged(u, v) {
    const self = this;
    // Corresponds to "D* Lite" paper "Scan graph for changed edge cost, if any edge cost changed" part.

    self.km = self.km + self._heuristicallyEstimatePathLength(self.discreteLastSrc, self.discreteCurrentSrc);
    self.discreteLastSrc = self.discreteCurrentSrc;
    self._onVertexUpdated(u);
    self.computePathFindingCaches();
  },

  computePathFindingCaches() {
    const self = this;
    // Corresponds to "D* Lite" paper "ComputeShortestPath" part.

    const tiledMapIns = self.mapIns.tiledMapIns;
    const mapSizeDiscrete = tiledMapIns.getMapSize();

    const discreteCurrentDestinationKey = window.describe(self.discreteCurrentDestination);
    const discreteCurrentSrcKey = window.describe(self.discreteCurrentSrc);
    console.log("id: ", self.node.uuid, ", discreteCurrentDst: " + discreteCurrentDestinationKey + ", discreteCurrentSrc: " + discreteCurrentSrcKey);

    const trialLimit = 500;
    let trialCount = 0;
    while (self.pqForPathFinding.top().key < self._calculatePriorityPair(self.discreteCurrentSrc) || self.rhsCache[discreteCurrentSrcKey] != self.gCache[discreteCurrentSrcKey]) {
      ++trialCount;
      if (trialCount > trialLimit) break; 
      const topNode = self.pqForPathFinding.pop();
      const kOld = topNode.key;  
      const u = topNode.value;  
      const uKey = window.describe(u);

      console.log("id: " + self.node.uuid + ", pqForPathFinding.size: " + self.pqForPathFinding.list.length + ", u: " + uKey + ", priority[u]: [" + kOld[0] + ", " + kOld[1] + "], rest in queue:");
      for (let node of self.pqForPathFinding.list) {
        console.log("priority: [" + node.key[0] + ", " + node.key[1] + "], pt: ", node.lookupKey);
      }

      const newPriority = self._calculatePriorityPair(u);

      if (self._keyCompare(kOld, newPriority) < 0) {
        self.pqForPathFinding.push(newPriority, u, uKey);
      } else if (self.gCache[uKey] > self.rhsCache[uKey]) {
        self.gCache[uKey] = self.rhsCache[uKey];
        for (let neighbourOffset of window.NEIGHBOUR_DISCRETE_OFFSETS) {
          const discreteNeighbourPos = {
            x: u.x + neighbourOffset.dx,
            y: u.y + neighbourOffset.dy,
          };

          if (discreteNeighbourPos.x < 0
            ||
            discreteNeighbourPos.x >= mapSizeDiscrete.width
            ||
            discreteNeighbourPos.y < 0
            ||
            discreteNeighbourPos.y >= mapSizeDiscrete.height
          ) {
            continue;
          }
          self._onVertexUpdated(discreteNeighbourPos);
        }
      } else {
        self.gCache[uKey] = Infinity;
        for (let neighbourOffset of window.NEIGHBOUR_DISCRETE_OFFSETS) {
          const discreteNeighbourPos = {
            x: u.x + neighbourOffset.dx,
            y: u.y + neighbourOffset.dy,
          };

          if (discreteNeighbourPos.x < 0
            ||
            discreteNeighbourPos.x >= mapSizeDiscrete.width
            ||
            discreteNeighbourPos.y < 0
            ||
            discreteNeighbourPos.y >= mapSizeDiscrete.height
          ) {
            continue;
          }
          self._onVertexUpdated(discreteNeighbourPos);
        }
        self._onVertexUpdated(u);
      }
    }
  },

  refreshContinuousStopsFromCurrentPositionToCurrentDestination() {
    const self = this;
    if (null == self.currentDestination) {
      self.movementStops = null;
      return;
    } 
    self.movementStops = [];

    const tiledMapIns = self.mapIns.tiledMapIns;
    const mapSizeDiscrete = tiledMapIns.getMapSize();

    const discreteCurrentPos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, self.node.position, cc.v2(0, 0));

    // console.log("For statefulBuildableFollowingNpcComp.uuid == ", self.uuid, ", found steps from ", self.node.position, " to ", self.currentDestination, " :", self.movementStops);

    let u = discreteCurrentPos; // for every "stop"
    while (u.x != self.discreteCurrentDestination.x || u.y != self.discreteCurrentDestination.y) {
      let nextU = null, nextUValue = Infinity;
      for (let neighbourOffset of window.NEIGHBOUR_DISCRETE_OFFSETS) {
        const discreteNeighbourPos = {
          x: u.x + neighbourOffset.dx,
          y: u.y + neighbourOffset.dy,
        };

        if (discreteNeighbourPos.x < 0
          ||
          discreteNeighbourPos.x >= mapSizeDiscrete.width
          ||
          discreteNeighbourPos.y < 0
          ||
          discreteNeighbourPos.y >= mapSizeDiscrete.height
        ) {
          continue;
        }
        
        const discreteNeighbourPosKey = window.describe(discreteNeighbourPos);
        const candidateGValue = self.gCache[discreteNeighbourPosKey];
        const candidateRhsValue = (candidateGValue + self._cost(discreteNeighbourPos, discretePos));

        if (candidateRhsValue < nextUValue) {
          nextU = discreteNeighbourPos;
          nextUValue = candidateRhsValue;
        }  
      }
      u = nextU;
      self.movementStops.push(tileCollisionManager._continuousFromCentreOfDiscreteTile(self.mapNode, self.mapIns.tiledMapIns, null, u.x, u.y));
    }
  },

  restartPatrolling() {
    const self = this;
    if (
        self.node.position.equals(self.currentDestination)
     || null == self.movementStops
     || self.movementStops.length == 1
    ) {
      self.transitToStaying();
      return;
    }

    if (2 <= self.movementStops.length) {
      /*
      [WARNING] 

      Cutting "stops[0]" if "self.node.position" is on the way between "stops[0] --> stops[1]".

      -- YFLu, 2019-10-08.
      */
      const diffV1 = self.node.position.sub(self.movementStops[0]);
      const diffV2 = self.movementStops[1].sub(self.movementStops[0]);
      if (0 < diffV1.dot(diffV2)) {
        const diffV3 = self.movementStops[1].sub(self.node.position);
        const diffVec = {
          dx: diffV3.x,
          dy: diffV3.y,
        };
        const discretizedDirection = self.mapIns.ctrl.discretizeDirection(diffVec.dx, diffVec.dy, self.mapIns.ctrl.joyStickEps);
        self.scheduleNewDirection(discretizedDirection);
        self.movementStops.shift();
      }
    }

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
    self.transitToMoving(actualExecution);
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

        const discreteCurrentPos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, self.node.position, cc.v2(0, 0));
        const discreteOtherColliderPos = tileCollisionManager._continuousToDiscrete(self.mapNode, self.mapIns.tiledMapIns, otherCollider.node.position, cc.v2(0, 0));

        self.onCostChanged(discreteCurrentPos, discreteOtherColliderPos);
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
    BasePlayer.prototype.onCollisionExit.call(this, otherCollider, selfCollider);
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
