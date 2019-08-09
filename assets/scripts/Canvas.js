const describe = function(discretePt) {
  return discretePt.x.toString() + "," + discretePt.y.toString();
};
window.describe = describe;

window.reverseHomingNpcDestinationDict = {};
window.reverseStatefulBuildableFollowingNpcDestinationDict = {};
window.cachedKnownBarrierGridDict = {};

const heuristicallyEstimatePathLength = function(p1, p2) {
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  return Math.sqrt(absDx * absDx + absDy * absDy);
};

const hamiltonDistance = function(p1, p2) {
  if (null != window.cachedKnownBarrierGridDict[p1.x] && true == window.cachedKnownBarrierGridDict[p1.x][p1.y]) {
    return Infinity;
  }
  if (null != window.cachedKnownBarrierGridDict[p2.x] && true == window.cachedKnownBarrierGridDict[p2.x][p2.y]) {
    return Infinity;
  }
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  return absDx + absDy;
};

window.hamiltonDistance = hamiltonDistance;

window.refreshCachedKnownBarrierGridDict = function(mapNode, barrierColliders, thisPlayerCollider) {
  let prevCachedKnownBarrierGridDict = {};
  const uniformDiscreteMargin = 0;
  
  const tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();

  for (let discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
    if (null == cachedKnownBarrierGridDict[discretePosXInMap]) {
      continue;
    }
    if (null == prevCachedKnownBarrierGridDict[discretePosXInMap]) {
      prevCachedKnownBarrierGridDict[discretePosXInMap] = {};
    }
    for (let discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
      if (true == cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
        prevCachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap] = true;
      }
    }
  }

  cachedKnownBarrierGridDict = {};
  let changedGridPos = [];

  for (let aComp of barrierColliders) {
    let toCollidePolygon = [];
    for (let p of aComp.points) {
      toCollidePolygon.push(aComp.node.position.add(p));
    }

    for (let discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
      for (let discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
        if (null != cachedKnownBarrierGridDict[discretePosXInMap]
          && true == cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
          continue;
        }

        let centreOfAnchorTileInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discretePosXInMap, discretePosYInMap);

        let toCollideCircle = {
          position: centreOfAnchorTileInMapNode.add(
            ((null == thisPlayerCollider) ? cc.v2(0, 0) : thisPlayerCollider.offset)
          ),
          radius: ((null == thisPlayerCollider) ? 20 : thisPlayerCollider.radius),
        };

        if (cc.Intersection.polygonCircle(toCollidePolygon, toCollideCircle)) {
          if (null == cachedKnownBarrierGridDict[discretePosXInMap]) {
            cachedKnownBarrierGridDict[discretePosXInMap] = {};
          }
          cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap] = true;
          if (null == prevCachedKnownBarrierGridDict[discretePosXInMap] || null == prevCachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
            changedGridPos.push(cc.v2(discretePosXInMap, discretePosYInMap));
          }
        } else {
          if (null != prevCachedKnownBarrierGridDict[discretePosXInMap] && true == prevCachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
            changedGridPos.push(cc.v2(discretePosXInMap, discretePosYInMap));
          }
        }
      }
    }
  }

  for (let k in window.mapIns.statefulBuildableFollowingNpcScriptInsDict) {
    const statefulBuildableFollowingNpc = window.mapIns.statefulBuildableFollowingNpcScriptInsDict[k]; 
    for (let v of changedGridPos) {
      statefulBuildableFollowingNpc.updatePathFindingCachesForDiscretePosition(v);
    }
  }  
};

const NEIGHBOUR_DISCRETE_OFFSETS = [{
  dx: 0,
  dy: 1
}, {
  dx: 1,
  dy: 1
}, {
  dx: 1,
  dy: 0
}, {
  dx: 1,
  dy: -1
}, {
  dx: 0,
  dy: -1
}, {
  dx: -1,
  dy: -1
}, {
  dx: -1,
  dy: 0
}, {
  dx: -1,
  dy: 1
}];
window.NEIGHBOUR_DISCRETE_OFFSETS = NEIGHBOUR_DISCRETE_OFFSETS;

window.findNearbyNonBarrierGridByBreathFirstSearch = function(mapNode, continuousSrcPtInMapNode /* cc.v2 */, minRequiredLayerDistance, maxExpanderTrialCount) {
  const tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();
  if (null == maxExpanderTrialCount) {
    maxExpanderTrialCount = ((mapSizeDiscrete.width*mapSizeDiscrete.height) << 1);
  }
 
  const discreteSrcPos = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, continuousSrcPtInMapNode, cc.v2(0, 0));

  let openDictFromSrc = new Set();
  let bfsQueue= []; 
  let closedSet = new Set();

  // Initialization.
  const starter = {
    pos: discreteSrcPos,
    layerDistance: 0,
    pre: null,
  };
  openDictFromSrc[describe(discreteSrcPos)] = starter;
  bfsQueue.push(discreteSrcPos);
  let expanderTrialCount = 0;

  // Main iteration body.  
  while (0 < bfsQueue.length) {
    if (expanderTrialCount > maxExpanderTrialCount) {
      cc.log(`No nearby non-barrier grid found for (${discreteSrcPos.x}, ${discreteSrcPos.y}), returning after maxExpanderTrialCount == ${maxExpanderTrialCount} reached.`);
      return null;
    }

    const expanderPos = bfsQueue.shift();
    if (null == expanderPos) {
      cc.log(`No nearby non-barrier grid found for (${discreteSrcPos.x}, ${discreteSrcPos.y}), no feasible expanderPos.`);
      return null;
    }
    const expanderKey = describe(expanderPos);
    const expander = openDictFromSrc[expanderKey];

    ++expanderTrialCount;

    delete openDictFromSrc[expanderKey]; // [SYNTAX NOTE] The actually heap content is still held by `expander` in the current closure. -- YFLu.
    closedSet.add(expanderKey);

    for (let neighbourOffset of NEIGHBOUR_DISCRETE_OFFSETS) {
      const discreteNeighbourPos = {
        x: expander.pos.x + neighbourOffset.dx,
        y: expander.pos.y + neighbourOffset.dy,
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

      const discreteNeighbourPosDesc = describe(discreteNeighbourPos);

      if (true == closedSet.has(discreteNeighbourPosDesc)) {
        continue;
      }

      let existingDiscreteNeighbourObj = openDictFromSrc[discreteNeighbourPosDesc];
      if (null == existingDiscreteNeighbourObj) {
        const discreteNeighbour = {
          pos: discreteNeighbourPos,
          layerDistance: (expander.layerDistance + 1),
          pre: expander,
        };
        existingDiscreteNeighbourObj = discreteNeighbour;
        openDictFromSrc[discreteNeighbourPosDesc] = discreteNeighbour;
        bfsQueue.push(discreteNeighbourPos);
      } else {
        const proposedLayerDistanceForNeighbour = (expander.layerDistance + 1);
        if (proposedLayerDistanceForNeighbour < existingDiscreteNeighbourObj) {
          existingDiscreteNeighbourObj.layerDistance = proposedLayerDistanceForNeighbour;
          existingDiscreteNeighbourObj.pre = expander;
        }
      }

      const theEffectiveDiscreteNeighbourLayerDistance = existingDiscreteNeighbourObj.layerDistance;
      if (
          theEffectiveDiscreteNeighbourLayerDistance >= minRequiredLayerDistance
          &&
          (
          null == cachedKnownBarrierGridDict[discreteNeighbourPos.x] 
          || 
          null == cachedKnownBarrierGridDict[discreteNeighbourPos.x][discreteNeighbourPos.y]
          ||
          false == cachedKnownBarrierGridDict[discreteNeighbourPos.x][discreteNeighbourPos.y]
          )
        ) {
        // Found a feasible solution.
        const continuousNeighbourPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discreteNeighbourPos.x, discreteNeighbourPos.y);
        return continuousNeighbourPtInMapNode;  
      }
    }
  }
  return null;
};

cc.Class({
  extends: cc.Component,

  properties: {
    map: {
      type: cc.Node,
      default: null
    },
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
  }
});
