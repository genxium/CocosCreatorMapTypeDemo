const describe = function(discretePt) {
  return discretePt.x.toString() + "," + discretePt.y.toString();
};
window.describe = describe;

window.reverseHomingNpcDestinationDict = {};
window.reverseStatefulBuildableFollowingNpcDestinationDict = {};
window.cachedKnownBarrierGridDict = {};

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
  let changedGridPosList = [];

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
        }
      }
    }
  }

  for (let discretePosXInMap = uniformDiscreteMargin; discretePosXInMap < mapSizeDiscrete.width - uniformDiscreteMargin; ++discretePosXInMap) {
    for (let discretePosYInMap = uniformDiscreteMargin; discretePosYInMap < mapSizeDiscrete.height - uniformDiscreteMargin; ++discretePosYInMap) {
      if (    
        (null != cachedKnownBarrierGridDict[discretePosXInMap] && true == cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap])
        &&
        (null == prevCachedKnownBarrierGridDict[discretePosXInMap] || true != prevCachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap])
        ) {
        changedGridPosList.push(cc.v2(discretePosXInMap, discretePosYInMap));
      } else {
        if (    
          (null != prevCachedKnownBarrierGridDict[discretePosXInMap] && true == prevCachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap])
          &&
          (null == cachedKnownBarrierGridDict[discretePosXInMap] || true != cachedKnownBarrierGridDict[discretePosXInMap][discretePosYInMap])
        ) {
          changedGridPosList.push(cc.v2(discretePosXInMap, discretePosYInMap));
        }
      }
    }
  }

  console.log("The list of `changedGridPosList` is ", changedGridPosList);
  for (let k in window.mapIns.statefulBuildableFollowingNpcScriptInsDict) {
    const statefulBuildableFollowingNpc = window.mapIns.statefulBuildableFollowingNpcScriptInsDict[k]; 
    statefulBuildableFollowingNpc.computePathFindingCaches();
    statefulBuildableFollowingNpc.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
    statefulBuildableFollowingNpc.restartPatrolling();
  }  
};

const NEIGHBOUR_DISCRETE_OFFSETS = [{
  dx: 0,
  dy: 1
}, {
  dx: 1,
  dy: 0
}, {
  dx: 0,
  dy: -1
}, {
  dx: -1,
  dy: 0
}];
window.NEIGHBOUR_DISCRETE_OFFSETS = NEIGHBOUR_DISCRETE_OFFSETS;

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
