const describe = function(discretePt) {
  return discretePt.x.toString() + "," + discretePt.y.toString();
};

const heuristicallyEstimatePathLength = function(p1, p2) {
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  return absDx + absDy;
};

const euclideanDistance = function(p1, p2) {
  const absDx = Math.abs(p1.x - p2.x);
  const absDy = Math.abs(p1.y - p2.y);
  return Math.sqrt(absDx * absDx + absDy * absDy);
};

window.cachedKnownBarrierGridDict = {};
window.refreshCachedKnownBarrierGridDict = function(mapNode, barrierColliders, thisPlayerCollider) {
  cachedKnownBarrierGridDict = {};
  let tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  const mapSizeDiscrete = tiledMapIns.getMapSize();
  const uniformDiscreteMargin = 0;

  for (let aComp of barrierColliders) {
    let toCollidePolygon = [];
    for (let p of aComp.points) {
      toCollidePolygon.push(aComp.node.position.add(p));
    }

    for (var discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
      for (var discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
        if (null != cachedKnownBarrierGridDict[discretePosXInMap]
          && true == cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap]) {
          continue;
        }

        var centreOfAnchorTileInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discretePosXInMap, discretePosYInMap);

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
        }
      }
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

window.findPathForType2NPCWithMapDiscretizingAStar = function(continuousSrcPtInMapNode, continuousDstPtInMapNode, eps, thisPlayerCollider, barrierColliders, controlledPlayerColliders, mapNode, maxExpanderTrialCount) {
  if (null == maxExpanderTrialCount) {
    maxExpanderTrialCount = 10000;
  }
  let tiledMapIns = mapNode.getComponent(cc.TiledMap); // This is a magic name.
  // [Phase#0] Discretize the mapNode to grids (be it ORTHO or ISOMETRIC w.r.t. orientation of the tiledMapIns) and mark `cachedKnownBarrierGridDict`.
  if (!cachedKnownBarrierGridDict) {
    window.refreshCachedKnownBarrierGridDict(mapNode, barrierColliders, thisPlayerCollider);
  }

  const discreteSrcPtInMapNode = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, null, continuousSrcPtInMapNode, cc.v2(0, 0));
  const discreteDstPtInMapNode = tileCollisionManager._continuousToDiscrete(mapNode, tiledMapIns, null, continuousDstPtInMapNode, cc.v2(0, 0));

  let openSetFromSrc = new Set();
  let closedSet = new Set();
  let dFromSrc = {}; // Actial distance for path "srcPt -> k (end of current path)". 
  let hTotal = {}; // Heuristically estimated total distance for path "srcPt -> k (must pass) -> dstPt". 

  // Initialization.
  openSetFromSrc.add(describe(discreteSrcPtInMapNode));
  dFromSrc[describe(discreteSrcPtInMapNode)] = {
    pos: discreteSrcPtInMapNode,
    value: 0.0,
    pre: null // Always NULL for `dFromSrc`.
  };
  hTotal[describe(discreteSrcPtInMapNode)] = {
    pos: discreteSrcPtInMapNode,
    value: dFromSrc[describe(discreteSrcPtInMapNode)].value + heuristicallyEstimatePathLength(discreteDstPtInMapNode, discreteDstPtInMapNode),
    pre: null
  };
  let expanderTrialCount = 0;

  // Main iteration body.  
  while (0 < openSetFromSrc.size) {
    if (expanderTrialCount > maxExpanderTrialCount) {
      cc.log(`No path for (${discreteSrcPtInMapNode.x}, ${discreteSrcPtInMapNode.y}) => (${discreteDstPtInMapNode.x}, ${discreteDstPtInMapNode.y}), returning after maxExpanderTrialCount == ${maxExpanderTrialCount} reached.`);
      return null;
    }
    // [Phase#1] 
    let expanderKey = null;
    let expander = null;
    for (let candidateKey of openSetFromSrc) {
      let candidate = hTotal[candidateKey];
      if (null != expander && (expander.value <= candidate.value)) continue;
      expanderKey = candidateKey;
      expander = candidate;
    }

    if (null == expanderKey) {
      // Not reachable in this discretization. 
      cc.log(`No path for (${discreteSrcPtInMapNode.x}, ${discreteSrcPtInMapNode.y}) => (${discreteDstPtInMapNode.x}, ${discreteDstPtInMapNode.y}), returning early.`);
      return null;
    }

    if (expander.pos.x == discreteDstPtInMapNode.x && expander.pos.y == discreteDstPtInMapNode.y) {
      // Found a path in this discretization. 
      let pathToRet = [];
      while (null != expander) {
        const discretePos = expander.pos;
        const continuousPtInMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(mapNode, tiledMapIns, null, discretePos.x, discretePos.y);
        pathToRet.push(continuousPtInMapNode);
        expander = expander.pre;
      }
      pathToRet.reverse();
      return pathToRet;
    }

    ++expanderTrialCount;

    // [Phase#2] 
    openSetFromSrc.delete(expanderKey);

    // [Phase#3] 
    closedSet.add(expanderKey);

    // [Phase#4] Traverse the neighbours of `expanderKey` and update accordingly.
    for (let neighbourOff of NEIGHBOUR_DISCRETE_OFFSETS) {
      const discreteNeighbourPtInMapNode = {
        x: expander.pos.x + neighbourOff.dx,
        y: expander.pos.y + neighbourOff.dy,
      };
      const discreteNeighbourPtInMapNodeDesc = describe(discreteNeighbourPtInMapNode);

      if (true == closedSet.has(discreteNeighbourPtInMapNodeDesc)) {
        continue;
      }
      if (cachedKnownBarrierGridDict[discreteNeighbourPtInMapNode.x] && true == cachedKnownBarrierGridDict[discreteNeighbourPtInMapNode.x][discreteNeighbourPtInMapNode.y]) {
        // cc.log(`discreteNeighbourPtInMapNode == (${discreteNeighbourPtInMapNode.x}, ${discreteNeighbourPtInMapNode.y}) is a knownBarrierGrid.`);
        continue;
      }

      if (!openSetFromSrc.has(discreteNeighbourPtInMapNodeDesc)) {
        openSetFromSrc.add(discreteNeighbourPtInMapNodeDesc);
      }
      const proposedNeighbourDFromSrcValue = dFromSrc[expanderKey].value + euclideanDistance(expander.pos, discreteNeighbourPtInMapNode);

      if (null == dFromSrc[discreteNeighbourPtInMapNodeDesc]) {
        dFromSrc[discreteNeighbourPtInMapNodeDesc] = {
          pos: discreteNeighbourPtInMapNode,
          value: proposedNeighbourDFromSrcValue,
          pre: null
        };
        hTotal[discreteNeighbourPtInMapNodeDesc] = {
          pos: discreteNeighbourPtInMapNode,
          value: proposedNeighbourDFromSrcValue + heuristicallyEstimatePathLength(discreteNeighbourPtInMapNode, discreteDstPtInMapNode),
          pre: hTotal[expanderKey],
        };
      } else {
        const origNeighbourDFromSrcValue = dFromSrc[discreteNeighbourPtInMapNodeDesc].val;
        if (origNeighbourDFromSrcValue <= proposedNeighbourDFromSrcValue) {
          continue;
        }
        dFromSrc[discreteNeighbourPtInMapNodeDesc].value = proposedNeighbourDFromSrcValue;
        hTotal[discreteNeighbourPtInMapNodeDesc].value = proposedNeighbourDFromSrcValue + heuristicallyEstimatePathLength(discreteNeighbourPtInMapNode, discreteDstPtInMapNode);
        hTotal[discreteNeighbourPtInMapNodeDesc].pre = hTotal[expanderKey];
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
    //window.resizeCallback(this.node);
  }
});
