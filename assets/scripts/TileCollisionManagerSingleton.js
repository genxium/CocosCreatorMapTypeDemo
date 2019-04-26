"use strict";

window.ALL_DISCRETE_DIRECTIONS_CLOCKWISE = [{
  dx: 0,
  dy: 1
}, {
  dx: 2,
  dy: 1
}, {
  dx: 2,
  dy: 0
}, {
  dx: 2,
  dy: -1
}, {
  dx: 0,
  dy: -1
}, {
  dx: -2,
  dy: -1
}, {
  dx: -2,
  dy: 0
}, {
  dx: -2,
  dy: 1
}];

function TileCollisionManager() {
}

TileCollisionManager.prototype._continuousFromCentreOfDiscreteTile = function(tiledMapNode, tiledMapIns, layerIns, discretePosX, discretePosY) {
  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();
  var mapAnchorOffset = cc.v2(0, 0);
  var tileSize = {
    width: 0,
    height: 0
  };
  var layerOffset = cc.v2(0, 0);

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      return null;

    case cc.TiledMap.Orientation.ISO:
      var tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width / 4 + mapTileRectilinearSize.height * mapTileRectilinearSize.height / 4);
      tileSize = {
        width: tileSizeUnifiedLength,
        height: tileSizeUnifiedLength
      };
      var cosineThetaRadian = mapTileRectilinearSize.width / 2 / tileSizeUnifiedLength;
      var sineThetaRadian = mapTileRectilinearSize.height / 2 / tileSizeUnifiedLength;
      mapAnchorOffset = cc.v2(
        tiledMapNode.getContentSize().width * (0.5 - tiledMapNode.getAnchorPoint().x),
        tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      );
      layerOffset = cc.v2(0, 0);
      var transMat = [
        [cosineThetaRadian, -cosineThetaRadian],
        [-sineThetaRadian, -sineThetaRadian]
      ];
      var tmpContinuousX = (parseFloat(discretePosX) + 0.5) * tileSizeUnifiedLength;
      var tmpContinuousY = (parseFloat(discretePosY) + 0.5) * tileSizeUnifiedLength;
      var dContinuousXWrtMapNode = transMat[0][0] * tmpContinuousX + transMat[0][1] * tmpContinuousY;
      var dContinuousYWrtMapNode = transMat[1][0] * tmpContinuousX + transMat[1][1] * tmpContinuousY;
      return cc.v2(dContinuousXWrtMapNode, dContinuousYWrtMapNode).add(mapAnchorOffset);

    default:
      return null;
  }
};

TileCollisionManager.prototype._continuousToDiscrete = function(tiledMapNode, tiledMapIns, continuousNewPosLocalToMap, continuousOldPosLocalToMap) {
  /*
   * References
   * - http://cocos2d-x.org/docs/api-ref/creator/v1.5/classes/TiledMap.html
   * - http://cocos2d-x.org/docs/api-ref/creator/v1.5/classes/TiledLayer.html
   * - http://docs.mapeditor.org/en/stable/reference/tmx-map-format/?highlight=orientation#map
   */
  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();
  var mapAnchorOffset = {
    x: 0,
    y: 0
  };
  var tileSize = {
    width: 0,
    height: 0
  };
  var layerOffset = {
    x: 0,
    y: 0
  };
  var convertedContinuousOldXInTileCoordinates = null;
  var convertedContinuousOldYInTileCoordinates = null;
  var convertedContinuousNewXInTileCoordinates = null;
  var convertedContinuousNewYInTileCoordinates = null;
  var oldWholeMultipleX = 0;
  var oldWholeMultipleY = 0;
  var newWholeMultipleX = 0;
  var newWholeMultipleY = 0;
  var discretePosX = 0;
  var discretePosY = 0;
  var exactBorderX = 0;
  var exactBorderY = 0; // These tmp variables are NOT NECESSARILY useful.

  var oldTmpX = 0;
  var oldTmpY = 0;
  var newTmpX = 0;
  var newTmpY = 0;

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      mapAnchorOffset = {
        x: -(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x),
        y: tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      };
      layerOffset = {
        x: 0,
        y: 0
      };
      tileSize = mapTileRectilinearSize;
      convertedContinuousOldXInTileCoordinates = continuousOldPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      convertedContinuousOldYInTileCoordinates = mapAnchorOffset.y - (continuousOldPosLocalToMap.y - layerOffset.y);
      convertedContinuousNewXInTileCoordinates = continuousNewPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      convertedContinuousNewYInTileCoordinates = mapAnchorOffset.y - (continuousNewPosLocalToMap.y - layerOffset.y);
      break;

    case cc.TiledMap.Orientation.ISO:
      var tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width / 4 + mapTileRectilinearSize.height * mapTileRectilinearSize.height / 4);
      tileSize = {
        width: tileSizeUnifiedLength,
        height: tileSizeUnifiedLength
      };
      var cosineThetaRadian = mapTileRectilinearSize.width / 2 / tileSizeUnifiedLength;
      var sineThetaRadian = mapTileRectilinearSize.height / 2 / tileSizeUnifiedLength;
      mapAnchorOffset = {
        x: tiledMapNode.getContentSize().width * (0.5 - tiledMapNode.getAnchorPoint().x),
        y: tiledMapNode.getContentSize().height * (1 - tiledMapNode.getAnchorPoint().y)
      };
      layerOffset = {
        x: 0,
        y: 0
      };
      oldTmpX = continuousOldPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      oldTmpY = continuousOldPosLocalToMap.y - layerOffset.y - mapAnchorOffset.y;
      newTmpX = continuousNewPosLocalToMap.x - layerOffset.x - mapAnchorOffset.x;
      newTmpY = continuousNewPosLocalToMap.y - layerOffset.y - mapAnchorOffset.y;
      var transMat = [[1 / (2 * cosineThetaRadian), -1 / (2 * sineThetaRadian)], [-1 / (2 * cosineThetaRadian), -1 / (2 * sineThetaRadian)]];
      convertedContinuousOldXInTileCoordinates = transMat[0][0] * oldTmpX + transMat[0][1] * oldTmpY;
      convertedContinuousOldYInTileCoordinates = transMat[1][0] * oldTmpX + transMat[1][1] * oldTmpY;
      convertedContinuousNewXInTileCoordinates = transMat[0][0] * newTmpX + transMat[0][1] * newTmpY;
      convertedContinuousNewYInTileCoordinates = transMat[1][0] * newTmpX + transMat[1][1] * newTmpY;
      break;

    default:
      break;
  }

  if (null == convertedContinuousOldXInTileCoordinates || null == convertedContinuousOldYInTileCoordinates || null == convertedContinuousNewXInTileCoordinates || null == convertedContinuousNewYInTileCoordinates) {
    return null;
  }

  oldWholeMultipleX = Math.floor(convertedContinuousOldXInTileCoordinates / tileSize.width);
  oldWholeMultipleY = Math.floor(convertedContinuousOldYInTileCoordinates / tileSize.height);
  newWholeMultipleX = Math.floor(convertedContinuousNewXInTileCoordinates / tileSize.width);
  newWholeMultipleY = Math.floor(convertedContinuousNewYInTileCoordinates / tileSize.height); // Mind that the calculation of `exactBorderY` is different for `convertedContinuousOldYInTileCoordinates <> convertedContinuousNewYInTileCoordinates`. 

  if (convertedContinuousOldYInTileCoordinates < convertedContinuousNewYInTileCoordinates) {
    exactBorderY = newWholeMultipleY * tileSize.height;

    if (convertedContinuousNewYInTileCoordinates > exactBorderY && convertedContinuousOldYInTileCoordinates <= exactBorderY) {
      // Will try to cross the border if (newWholeMultipleY != oldWholeMultipleY).
      discretePosY = newWholeMultipleY;
    } else {
      discretePosY = oldWholeMultipleY;
    }
  } else if (convertedContinuousOldYInTileCoordinates > convertedContinuousNewYInTileCoordinates) {
    exactBorderY = oldWholeMultipleY * tileSize.height;

    if (convertedContinuousNewYInTileCoordinates < exactBorderY && convertedContinuousOldYInTileCoordinates >= exactBorderY) {
      // Will try to cross the border if (newWholeMultipleY != oldWholeMultipleY).
      discretePosY = newWholeMultipleY;
    } else {
      discretePosY = oldWholeMultipleY;
    }
  } else {
    discretePosY = oldWholeMultipleY;
  } // Mind that the calculation of `exactBorderX` is different for `convertedContinuousOldXInTileCoordinates <> convertedContinuousNewXInTileCoordinates`. 


  if (convertedContinuousOldXInTileCoordinates < convertedContinuousNewXInTileCoordinates) {
    exactBorderX = newWholeMultipleX * tileSize.width;

    if (convertedContinuousNewXInTileCoordinates > exactBorderX && convertedContinuousOldXInTileCoordinates <= exactBorderX) {
      // Will cross the border if (newWholeMultipleX != oldWholeMultipleX).
      discretePosX = newWholeMultipleX;
    } else {
      discretePosX = oldWholeMultipleX;
    }
  } else if (convertedContinuousOldXInTileCoordinates > convertedContinuousNewXInTileCoordinates) {
    exactBorderX = oldWholeMultipleX * tileSize.width;

    if (convertedContinuousNewXInTileCoordinates < exactBorderX && convertedContinuousOldXInTileCoordinates >= exactBorderX) {
      // Will cross the border if (newWholeMultipleX != oldWholeMultipleX).
      discretePosX = newWholeMultipleX;
    } else {
      discretePosX = oldWholeMultipleX;
    }
  } else {
    discretePosX = oldWholeMultipleX;
  }

  return {
    x: discretePosX,
    y: discretePosY
  };
};

TileCollisionManager.prototype.continuousMapNodeVecToContinuousObjLayerVec = function(withTiledMapNode, continuousMapNodeVec) {
  var tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      var tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width * 0.25 + mapTileRectilinearSize.height * mapTileRectilinearSize.height * 0.25);
      var isometricObjectLayerPointOffsetScaleFactor = (tileSizeUnifiedLength / mapTileRectilinearSize.height);
      var inverseIsometricObjectLayerPointOffsetScaleFactor = 1 / isometricObjectLayerPointOffsetScaleFactor;

      var cosineThetaRadian = (mapTileRectilinearSize.width * 0.5) / tileSizeUnifiedLength;
      var sineThetaRadian = (mapTileRectilinearSize.height * 0.5) / tileSizeUnifiedLength;

      var inverseTransMat = [
        [inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / cosineThetaRadian), -inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / sineThetaRadian)],
        [-inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / cosineThetaRadian), -inverseIsometricObjectLayerPointOffsetScaleFactor * 0.5 * (1 / sineThetaRadian)]
      ];
      var convertedVecX = inverseTransMat[0][0] * continuousMapNodeVec.x + inverseTransMat[0][1] * continuousMapNodeVec.y;
      var convertedVecY = inverseTransMat[1][0] * continuousMapNodeVec.x + inverseTransMat[1][1] * continuousMapNodeVec.y;

      return cc.v2(convertedVecX, convertedVecY);

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousObjLayerVecToContinuousMapNodeVec = function(withTiledMapNode, continuousObjLayerVec) {
  var tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      var tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width * 0.25 + mapTileRectilinearSize.height * mapTileRectilinearSize.height * 0.25);
      var isometricObjectLayerPointOffsetScaleFactor = (tileSizeUnifiedLength / mapTileRectilinearSize.height);

      var cosineThetaRadian = (mapTileRectilinearSize.width * 0.5) / tileSizeUnifiedLength;
      var sineThetaRadian = (mapTileRectilinearSize.height * 0.5) / tileSizeUnifiedLength;

      var transMat = [
        [isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian],
        [-isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian]
      ];
      var convertedVecX = transMat[0][0] * continuousObjLayerVec.x + transMat[0][1] * continuousObjLayerVec.y;
      var convertedVecY = transMat[1][0] * continuousObjLayerVec.x + transMat[1][1] * continuousObjLayerVec.y;

      return cc.v2(convertedVecX, convertedVecY);

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousObjLayerOffsetToContinuousMapNodePos = function(withTiledMapNode, continuousObjLayerOffset) {
  var tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      var calibratedVec = continuousObjLayerOffset; // TODO: Respect the real offsets!

      // The immediately following statement takes a magic assumption that the anchor of `withTiledMapNode` is (0.5, 0.5) which is NOT NECESSARILY true.
      var layerOffset = cc.v2(0, +(withTiledMapNode.getContentSize().height * 0.5));

      return layerOffset.add(this.continuousObjLayerVecToContinuousMapNodeVec(withTiledMapNode, calibratedVec));

    default:
      return null;
  }
}

TileCollisionManager.prototype.continuousMapNodePosToContinuousObjLayerOffset = function(withTiledMapNode, continuousMapNodePos) {
  var tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap);

  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return null;

    case cc.TiledMap.Orientation.ISO:
      // The immediately following statement takes a magic assumption that the anchor of `withTiledMapNode` is (0.5, 0.5) which is NOT NECESSARILY true.
      var layerOffset = cc.v2(0, +(withTiledMapNode.getContentSize().height * 0.5));
      var calibratedVec = continuousMapNodePos.sub(layerOffset); // TODO: Respect the real offsets!
      return this.continuousMapNodeVecToContinuousObjLayerVec(withTiledMapNode, calibratedVec);

    default:
      return null;
  }
}

/**
 * Note that `TileCollisionManager.extractBoundaryObjects` returns everything with coordinates local to `withTiledMapNode`!
 */
TileCollisionManager.prototype.extractBoundaryObjects = function(withTiledMapNode) {
  var toRet = {
    barriers: [],
    transparents: [],
    shelterChainTails: [],
    shelterChainHeads: [],
    sheltersZReducer: [],
    frameAnimations: [],
    imageObjects: [],
    grandBoundaries: [],
    restaurants: [],
  };
  var tiledMapIns = withTiledMapNode.getComponent(cc.TiledMap); // This is a magic name.
  var mapTileSize = tiledMapIns.getTileSize();
  var mapOrientation = tiledMapIns.getMapOrientation();

  /*
   * Copies from https://github.com/cocos-creator/engine/blob/master/cocos2d/tilemap/CCTiledMap.js as a hack to parse advanced <tile> info
   * of a TSX file. [BEGINS]
   */
  var file = tiledMapIns._tmxFile;
  var texValues = file.textures;
  var texKeys = file.textureNames;
  var textures = {};
  for (var texIdx = 0; texIdx < texValues.length; ++texIdx) {
    textures[texKeys[texIdx]] = texValues[texIdx];
  }

  var tsxFileNames = file.tsxFileNames;
  var tsxFiles = file.tsxFiles;
  var tsxMap = {};
  for (var tsxFilenameIdx = 0; tsxFilenameIdx < tsxFileNames.length; ++tsxFilenameIdx) {
    if (0 >= tsxFileNames[tsxFilenameIdx].length) continue;
    tsxMap[tsxFileNames[tsxFilenameIdx]] = tsxFiles[tsxFilenameIdx].text;
  }

  var mapInfo = new cc.TMXMapInfo(file.tmxXmlStr, tsxMap, textures);
  var tileSets = mapInfo.getTilesets();
  /*
   * Copies from https://github.com/cocos-creator/engine/blob/master/cocos2d/tilemap/CCTiledMap.js as a hack to parse advanced <tile> info
   * of a TSX file. [ENDS]
   */
  var gidBoundariesMap = {};
  var tilesElListUnderTilesets = {};
  for (var tsxFilenameIdx = 0; tsxFilenameIdx < tsxFileNames.length; ++tsxFilenameIdx) {

    var tsxOrientation = tileSets[tsxFilenameIdx].orientation;
    if (cc.TiledMap.Orientation.ORTHO == tsxOrientation) {
      cc.error("Error at tileset %s: We proceed with ONLY tilesets in ORTHO orientation for all map orientations by now.", tsxFileNames[tsxFilenameIdx]);
      continue;
    }
    ;

    var tsxXMLStr = tsxMap[tsxFileNames[tsxFilenameIdx]];
    var selTileset = mapInfo._parser._parseXML(tsxXMLStr).documentElement;
    var firstGid = (parseInt(selTileset.getAttribute('firstgid')) || tileSets[tsxFilenameIdx].firstGid || 0);
    var currentTiles = selTileset.getElementsByTagName('tile');
    if (!currentTiles) continue;
    tilesElListUnderTilesets[tsxFileNames[tsxFilenameIdx]] = currentTiles;

    for (var tileIdx = 0; tileIdx < currentTiles.length; ++tileIdx) {
      var currentTile = currentTiles[tileIdx];
      var parentGID = parseInt(firstGid) + parseInt(currentTile.getAttribute('id') || 0);
      if (cc.sys.isNative) {
        var childrenOfCurrentTile = currentTile.getElementsByTagName("objectgroup");
      } else {
        var childrenOfCurrentTile = currentTile.children;
      }
      for (var childIdx = 0; childIdx < childrenOfCurrentTile.length; ++childIdx) {
        var ch = childrenOfCurrentTile[childIdx];
        if (!(ch.nodeName === 'objectgroup')) continue;
        var currentObjectGroupUnderTile = mapInfo._parseObjectGroup(ch);
        gidBoundariesMap[parentGID] = {
          barriers: [],
          shelterChainTails: [],
          shelterChainHeads: [],
          transparents: [],
          sheltersZReducer: [],
          tilesetTileSize: tileSets[tsxFilenameIdx]._tileSize,
        };
        for (var oidx = 0; oidx < currentObjectGroupUnderTile._objects.length; ++oidx) {
          var oo = currentObjectGroupUnderTile._objects[oidx];
          var polylinePoints = oo.polylinePoints;
          if (!polylinePoints) continue;
          var boundaryType = oo.boundary_type;
          switch (boundaryType) {
            case "barrier":
              var brToPushTmp = [];
              for (var bidx = 0; bidx < polylinePoints.length; ++bidx) {
                brToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[bidx]));
              }
              gidBoundariesMap[parentGID].barriers.push(brToPushTmp);
              break;
            case "transparent":
              var transToPushTmp = [];
              for (var shidx = 0; shidx < polylinePoints.length; ++shidx) {
                transToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].transparents.push(transToPushTmp);
              break;
            case "shelter_z_reducer":
              var shzrToPushTmp = [];
              for (var shzridx = 0; shzridx < polylinePoints.length; ++shzridx) {
                shzrToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shzridx]));
              }
              gidBoundariesMap[parentGID].sheltersZReducer.push(shzrToPushTmp);
              break;
            case "shelter_chain_tail":
              let shChainTailToPushTmp = [];
              for (let shidx = 0; shidx < polylinePoints.length; ++shidx) {
                shChainTailToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].shelterChainTails.push(shChainTailToPushTmp);
              break;
            case "shelter_chain_head":
              let shChainHeadToPushTmp = [];
              for (let shidx = 0; shidx < polylinePoints.length; ++shidx) {
                shChainHeadToPushTmp.push(cc.v2(oo.x, oo.y).add(polylinePoints[shidx]));
              }
              gidBoundariesMap[parentGID].shelterChainHeads.push(shChainHeadToPushTmp);
              break;
            default:
              break;
          }
        }
      }
    }
  }
  // Reference http://docs.cocos.com/creator/api/en/classes/TiledMap.html.
  var allObjectGroups = tiledMapIns.getObjectGroups();

  for (var i = 0; i < allObjectGroups.length; ++i) {
    // Reference http://docs.cocos.com/creator/api/en/classes/TiledObjectGroup.html.
    var objectGroup = allObjectGroups[i];
    if ("sprite_frame" != objectGroup.getProperty("type")) continue;
    var allObjects = objectGroup.getObjects();
    for (var j = 0; j < allObjects.length; ++j) {
      var object = allObjects[j];
      var gid = object.gid;
      if (!gid || gid <= 0) {
        // cc.log("gid is null ", gid)
        continue;
      }
      var spriteFrameInfoForGid = getOrCreateSpriteFrameForGid(gid, mapInfo, tilesElListUnderTilesets);
      if (!spriteFrameInfoForGid) {
        // cc.log("cannot find the spriteFrameInfoForGid for gid: ", gid)
        continue;
      }

      const theImageObject = {
        posInMapNode: this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset),
        origSize: spriteFrameInfoForGid.origSize,
        sizeInMapNode: cc.size(object.width, object.height),
        spriteFrame: spriteFrameInfoForGid.spriteFrame,
        imageObjectNode: null,
        restaurantId: objectGroup.getProperty("restaurantId"),
        restaurantLevel: object.level,
        name: object.name, //FOR DEBUG 
        restaurantButtonId: object.restaurantButtonId,
      };
      toRet.imageObjects.push(theImageObject);
      if (!gidBoundariesMap[gid]) {
        continue;
      }
      const gidBoundaries = gidBoundariesMap[gid];
      // Note that currently the polyline points within each `gidBoundaries` is respecting the "topleft corner as (0, 0) where x+ points toward right and y+ points toward down."
      // Due to a special requirement for "image-type Tiled object" by "CocosCreator v2.0.1", we'll be using cc.v2(0.5, 0) as the anchor of the scaled spriteframe, but cc.v2(0, 0) as the anchor of the scaled boundaries.
      let unscaledSpriteFrameCenterInMapNode = this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset);
      const scaleX = (object.width / spriteFrameInfoForGid.origSize.width);
      const scaleY = (object.height / spriteFrameInfoForGid.origSize.height);
      let currentSpriteFrameAnchorPosInMapNode = unscaledSpriteFrameCenterInMapNode.sub(cc.v2(0, 0.5 * spriteFrameInfoForGid.origSize.height));
      let currentObjPosInMapNode = currentSpriteFrameAnchorPosInMapNode.add(cc.v2(0, 0.5 * gidBoundaries.tilesetTileSize.height /* WARNING: Using "0.5*object.height" instead would be INCORRECT! */ ));

      for (var bidx = 0; bidx < gidBoundaries.barriers.length; ++bidx) {
        var theBarrier = gidBoundaries.barriers[bidx]; // An array of cc.v2 points.
        var brToPushTmp = [];
        for (var tbidx = 0; tbidx < theBarrier.length; ++tbidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theBarrier[tbidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theBarrier[tbidx].y));
          brToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        brToPushTmp.imageObject = theImageObject;
        toRet.barriers.push(brToPushTmp);
      }
      for (let shidx = 0; shidx < gidBoundaries.shelterChainTails.length; ++shidx) {
        let theShelter = gidBoundaries.shelterChainTails[shidx]; // An array of cc.v2 points.
        let shToPushTmp = [];
        for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshidx].y));
          shToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shToPushTmp.imageObject = theImageObject;
        toRet.shelterChainTails.push(shToPushTmp);
      }
      for (let shidx = 0; shidx < gidBoundaries.shelterChainHeads.length; ++shidx) {
        let theShelter = gidBoundaries.shelterChainHeads[shidx]; // An array of cc.v2 points.
        let shToPushTmp = [];
        for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshidx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshidx].y));
          shToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shToPushTmp.imageObject = theImageObject;
        toRet.shelterChainHeads.push(shToPushTmp);
      }
      for (var shzridx = 0; shzridx < gidBoundaries.sheltersZReducer.length; ++shzridx) {
        var theShelter = gidBoundaries.sheltersZReducer[shzridx]; // An array of cc.v2 points.
        var shzrToPushTmp = [];
        for (var tshzridx = 0; tshzridx < theShelter.length; ++tshzridx) {
          const polylinePointOffsetInMapNode = cc.v2(-scaleX * (0.5 * gidBoundaries.tilesetTileSize.width - theShelter[tshzridx].x), scaleY * (gidBoundaries.tilesetTileSize.height - theShelter[tshzridx].y));
          shzrToPushTmp.push(currentObjPosInMapNode.add(polylinePointOffsetInMapNode));
        }
        shzrToPushTmp.imageObject = theImageObject;
        toRet.sheltersZReducer.push(shzrToPushTmp);
      }
    }
  }
  for (var i = 0; i < allObjectGroups.length; ++i) {
    // Reference http://docs.cocos.com/creator/api/en/classes/TiledObjectGroup.html.
    var objectGroup = allObjectGroups[i];
    if ("frame_anim" != objectGroup.getProperty("type")) continue;
    var allObjects = objectGroup.getObjects();
    for (var j = 0; j < allObjects.length; ++j) {
      var object = allObjects[j];
      var gid = object.gid;
      if (!gid || gid <= 0) {
        continue;
      }
      var animationClipInfoForGid = getOrCreateAnimationClipForGid(gid, mapInfo, tilesElListUnderTilesets);
      if (!animationClipInfoForGid) continue;
      toRet.frameAnimations.push({
        posInMapNode: this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset),
        origSize: animationClipInfoForGid.origSize,
        sizeInMapNode: cc.size(object.width, object.height),
        animationClip: animationClipInfoForGid.animationClip,
        type: objectGroup.getProperty("animType"),
        restaurantId: object.restaurantId,
      });
    }
  }
  for (var i = 0; i < allObjectGroups.length; ++i) {
    var objectGroup = allObjectGroups[i];
    if ("barrier_and_shelter" != objectGroup.getProperty("type")) continue;
    var allObjects = objectGroup.getObjects();
    for (var j = 0; j < allObjects.length; ++j) {
      var object = allObjects[j];
      var gid = object.gid;
      if (gid > 0) {
        continue;
      }
      var polylinePoints = object.polylinePoints;
      if (!polylinePoints) {
        continue
      }
      var boundaryType = object.boundary_type;
      switch (boundaryType) {
        case "barrier":
          var toPushBarriers = [];
          for (var k = 0; k < polylinePoints.length; ++k) {
            toPushBarriers.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[k])));
          }
          toRet.barriers.push(toPushBarriers);
          break;
        case "transparent":
          var toPushTrans = [];
          for (var kk = 0; kk < polylinePoints.length; ++kk) {
            toPushTrans.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kk])));
          }
          toRet.transparents.push(toPushTrans);
          break;
        case "shelter_z_reducer":
          var toPushSheltersZReducer = [];
          for (var kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushSheltersZReducer.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.sheltersZReducer.push(toPushSheltersZReducer);
          break;
        case "restaurant":
          var toPushRestaurant = [];
          for (var kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushRestaurant.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.restaurants.push(toPushRestaurant);
          break;
        case "grand_boundary":
          var toPushGrandBoundaries = [];
          for (var kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushGrandBoundaries.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.grandBoundaries.push(toPushGrandBoundaries);
          break;
        case "shelter_chain_head":
          let toPushShelterChainHeads = [];
          for (let kk = 0; kk < polylinePoints.length; ++kk) {
            toPushShelterChainHeads.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kk])));
          }
          toRet.shelterChainHeads.push(toPushShelterChainHeads);
          break;
        case "shelter_z_reducer":
          let toPushSheltersZReducer = [];
          for (let kkk = 0; kkk < polylinePoints.length; ++kkk) {
            toPushSheltersZReducer.push(this.continuousObjLayerOffsetToContinuousMapNodePos(withTiledMapNode, object.offset.add(polylinePoints[kkk])));
          }
          toRet.sheltersZReducer.push(toPushSheltersZReducer);
          break;
        default:
          break;
      }
    }
  }

  var mapTileSize = tiledMapIns.getTileSize();
  var allLayers = tiledMapIns.getLayers();

  var layerDOMTrees = [];
  var mapDomTree = mapInfo._parser._parseXML(tiledMapIns.tmxAsset.tmxXmlStr).documentElement;
  if (cc.sys.isNative) {
    var mapDOMAllChildren = mapDomTree.getElementsByTagName("layer");
  } else {
    var mapDOMAllChildren = mapDomTree.children;
  }
  for (var mdtIdx = 0; mdtIdx < mapDOMAllChildren.length; ++mdtIdx) {
    var tmpCh = mapDOMAllChildren[mdtIdx];
    if (mapInfo._shouldIgnoreNode(tmpCh)) {
      continue;
    }

    if (tmpCh.nodeName != 'layer') {
      continue;
    }
    layerDOMTrees.push(tmpCh);
  }
  for (var j = 0; j < allLayers.length; ++j) {
    // TODO: Respect layer offset!
    var currentTileLayer = allLayers[j];
    var currentTileset = currentTileLayer.getTileSet();

    if (!currentTileset) {
      continue;
    }

    var currentLayerSize = currentTileLayer.getLayerSize();

    var currentLayerTileSize = currentTileset._tileSize;
    var firstGidInCurrentTileset = currentTileset.firstGid;

    /*
    if ((0 != currentLayerTileSize.width % mapTileSize.width) || (0 != currentLayerTileSize.height % mapTileSize.height)) {
      cc.error("TileSize of tileSet %s is not a multiple of the mapTileSize.", currentTileset.name); 
    }
    */

    for (var discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
      for (var discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
        var currentGid = currentTileLayer.getTileGIDAt(discreteXInLayer, discreteYInLayer);
        if (0 >= currentGid) continue;
        var gidBoundaries = gidBoundariesMap[currentGid];
        if (!gidBoundaries) continue;
        switch (mapOrientation) {
          case cc.TiledMap.Orientation.ORTHO:
            // TODO
            return toRet;

          case cc.TiledMap.Orientation.ISO:
            var centreOfAnchorTileInMapNode = this._continuousFromCentreOfDiscreteTile(withTiledMapNode, tiledMapIns, currentTileLayer, discreteXInLayer, discreteYInLayer);
            var topLeftOfWholeTsxTileInMapNode = centreOfAnchorTileInMapNode.add(cc.v2(-0.5 * mapTileSize.width, currentLayerTileSize.height - 0.5 * mapTileSize.height));
            for (var bidx = 0; bidx < gidBoundaries.barriers.length; ++bidx) {
              var theBarrier = gidBoundaries.barriers[bidx]; // An array of cc.v2 points.
              var brToPushTmp = [];
              for (var tbidx = 0; tbidx < theBarrier.length; ++tbidx) {
                brToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theBarrier[tbidx].x, -theBarrier[tbidx].y /* Mind the reverse y-axis here. */ )));
              }
              toRet.barriers.push(brToPushTmp);
            }
            for (var shidx = 0; shidx < gidBoundaries.transparents.length; ++shidx) {
              var theTransparent = gidBoundaries.transparents[shidx]; // An array of cc.v2 points.
              var transToPushTmp = [];
              for (var tshidx = 0; tshidx < theTransparent.length; ++tshidx) {
                transToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theTransparent[tshidx].x, -theTransparent[tshidx].y)));
              }
              transToPushTmp.pTiledLayer = currentTileLayer;
              transToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.transparents.push(transToPushTmp);
            }
            for (let shidx = 0; shidx < gidBoundaries.shelterChainTails.length; ++shidx) {
              let theShelter = gidBoundaries.shelterChainTails[shidx]; // An array of cc.v2 points.
              let shToPushTmp = [];
              for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
                shToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshidx].x, -theShelter[tshidx].y)));
              }
              shToPushTmp.pTiledLayer = currentTileLayer;
              shToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.shelterChainTails.push(shToPushTmp);
            }
            for (let shidx = 0; shidx < gidBoundaries.shelterChainHeads.length; ++shidx) {
              let theShelter = gidBoundaries.shelterChainHeads[shidx]; // An array of cc.v2 points.
              let shToPushTmp = [];
              for (let tshidx = 0; tshidx < theShelter.length; ++tshidx) {
                shToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshidx].x, -theShelter[tshidx].y)));
              }
              shToPushTmp.pTiledLayer = currentTileLayer;
              shToPushTmp.tileDiscretePos = cc.v2(discreteXInLayer, discreteYInLayer);
              toRet.shelterChainHeads.push(shToPushTmp);
            }
            for (var shzridx = 0; shzridx < gidBoundaries.sheltersZReducer.length; ++shzridx) {
              var theShelter = gidBoundaries.sheltersZReducer[shzridx]; // An array of cc.v2 points.
              var shzrToPushTmp = [];
              for (var tshzridx = 0; tshzridx < theShelter.length; ++tshzridx) {
                shzrToPushTmp.push(topLeftOfWholeTsxTileInMapNode.add(cc.v2(theShelter[tshzridx].x, -theShelter[tshzridx].y)));
              }
              toRet.sheltersZReducer.push(shzrToPushTmp);
            }

            continue;

          default:
            return toRet;
        }
      }
    }
  }
  return toRet;
}

TileCollisionManager.prototype.initMapNodeByTiledBoundaries = function(mapScriptIns, mapNode, extractedBoundaryObjs) {
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  if (extractedBoundaryObjs.grandBoundaries) {
    window.grandBoundary = [];
    for (let boundaryObj of extractedBoundaryObjs.grandBoundaries) {
      for (let p of boundaryObj) {
        if (CC_DEBUG) {
          const labelNode = new cc.Node();
          labelNode.setPosition(p);
          const label = labelNode.addComponent(cc.Label);
          label.string = "GB_(" + p.x.toFixed(2) + ", " + p.y.toFixed(2) + ")";
          safelyAddChild(mapNode, labelNode);
          setLocalZOrder(labelNode, 999);
        }
        window.grandBoundary.push(p);
      }
      break;
    }
  }
  mapScriptIns.restaurantLayers = {};
  mapScriptIns.restaurantButtonsInImageObject = {};
  for (let imageObject of extractedBoundaryObjs.imageObjects) {
    const imageObjectNode = cc.instantiate(mapScriptIns.imageObjectPrefab);
    const spriteComp = imageObjectNode.getComponent(cc.Sprite);
    imageObjectNode.setPosition(imageObject.posInMapNode);
    imageObjectNode.width = imageObject.sizeInMapNode.width;
    imageObjectNode.height = imageObject.sizeInMapNode.height;
    imageObjectNode.setScale(imageObject.sizeInMapNode.width / imageObject.origSize.width, imageObject.sizeInMapNode.height / imageObject.origSize.height);
    imageObjectNode.setAnchorPoint(cc.v2(0.5, 0)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
    spriteComp.spriteFrame = imageObject.spriteFrame;
    imageObjectNode.active = false;
    safelyAddChild(mapScriptIns.node, imageObjectNode);
    setLocalZOrder(imageObjectNode, window.CORE_LAYER_Z_INDEX.IMAGE_OBJ);
    imageObjectNode.origZIndex = window.CORE_LAYER_Z_INDEX.IMAGE_OBJ;
    imageObject.imageObjectNode = imageObjectNode;
    /** init the objectNode in restaurant begin. **/
    const restaurantId = imageObject.restaurantId;
    if (restaurantId) {
      let theRestaurantLayer = mapScriptIns.restaurantLayers[restaurantId]; //restaurantLayers[restaurantId][layer] = [];  
      if (!theRestaurantLayer) {
        mapScriptIns.restaurantLayers[restaurantId] = {};
        theRestaurantLayer = mapScriptIns.restaurantLayers[restaurantId];
      }
      const levelList = imageObject.restaurantLevel;
      if (!levelList) {
        cc.error(`the restaurantLayer obejct has no level porperty and the objectName == ${imageObject.name}, restaurantId == ${restaurantId}`)
        continue;
      }
      const levels = levelList.split(",");
      for (let level of levels) {
        let theRestaurantLayerInLevel = theRestaurantLayer[level];
        if (!theRestaurantLayerInLevel) {
          theRestaurantLayer[level] = new Set();
          theRestaurantLayerInLevel = theRestaurantLayer[level];
        }
        theRestaurantLayerInLevel.add(imageObjectNode);
      }
    }
    /** init the objectNode in restaurant end. **/

    const restaurantButtonId = imageObject.restaurantButtonId;
    /** init the objectNode which is restaurantButton begins.**/
    if (restaurantButtonId) {
      mapScriptIns.restaurantButtonsInImageObject[restaurantButtonId] = imageObjectNode;
    }
  /** init the objectNode which is restaurantButton ends.**/
  }

  mapScriptIns.dictOfTiledFrameAnimationList = {};
  for (let frameAnim of extractedBoundaryObjs.frameAnimations) {
    if (!frameAnim.type) {
      cc.warn("should bind a type to the frameAnim obejct layer");
      continue
    }
    const tiledMapIns = mapScriptIns.node.getComponent(cc.TiledMap);
    let frameAnimInType = mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type];
    if (!frameAnimInType) {
      mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type] = [];
      frameAnimInType = mapScriptIns.dictOfTiledFrameAnimationList[frameAnim.type];
    }
    //初始化升级动画节点
    if (constants.ANIM_LAYER_TYPE.BUILDING_OR_UPGRADING == frameAnim.type || constants.ANIM_LAYER_TYPE.UPGRAD_COMPLETED) {
      const animNodeDstList = tiledMapIns.getObjectGroup("upgradeOrFinishedFrameInRestaurant");
      const objectsInList = animNodeDstList.getObjects();
      for (let i = 0; i < objectsInList.length; i++) {
        let animFrameNodeInPos = this.continuousObjLayerOffsetToContinuousMapNodePos(mapScriptIns.node, objectsInList[i].offset);
        const animNode = cc.instantiate(mapScriptIns.tiledAnimPrefab);
        const anim = animNode.getComponent(cc.Animation);
        animNode.setPosition(animFrameNodeInPos);
        animNode.width = frameAnim.sizeInMapNode.width;
        animNode.height = frameAnim.sizeInMapNode.height;
        animNode.setScale(frameAnim.sizeInMapNode.width / frameAnim.origSize.width, frameAnim.sizeInMapNode.height / frameAnim.origSize.height);
        animNode.opacity = 0;
        animNode.setAnchorPoint(cc.v2(0.5, 0.5)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
        safelyAddChild(mapScriptIns.node, animNode);
        setLocalZOrder(animNode, 5);
        anim.addClip(frameAnim.animationClip, "default");
        anim.play("default");
        animNode.restaurantId = objectsInList[i].restaurantId;
        frameAnimInType.push(animNode);
      }
    } else {
      const animNode = cc.instantiate(mapScriptIns.tiledAnimPrefab);
      const anim = animNode.getComponent(cc.Animation);
      animNode.setPosition(frameAnim.posInMapNode);
      animNode.width = frameAnim.sizeInMapNode.width;
      animNode.height = frameAnim.sizeInMapNode.height;
      animNode.setScale(frameAnim.sizeInMapNode.width / frameAnim.origSize.width, frameAnim.sizeInMapNode.height / frameAnim.origSize.height);
      animNode.opacity = 0;
      animNode.setAnchorPoint(cc.v2(0.5, 0)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
      safelyAddChild(mapScriptIns.node, animNode);
      setLocalZOrder(animNode, 5);
      anim.addClip(frameAnim.animationClip, "default");
      anim.play("default");
      animNode.restaurantId = frameAnim.restaurantId;
      frameAnimInType.push(animNode);
    }
  }

  for (let boundaryObj of extractedBoundaryObjs.shelterChainTails) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newShelter.pTiledLayer = boundaryObj.pTiledLayer;
    newShelter.tileDiscretePos = boundaryObj.tileDiscretePos;
    if (null != boundaryObj.imageObject) {
      newShelter.imageObject = boundaryObj.imageObject;
      newShelter.tailOrHead = "tail";
      window.addToGlobalShelterChainVerticeMap(newShelter.imageObject.imageObjectNode); // Deliberately NOT adding at the "traversal of shelterChainHeads".
    }
    newShelter.boundaryObj = boundaryObj;
    mapScriptIns.node.addChild(newShelter);
  }

  for (let boundaryObj of extractedBoundaryObjs.shelterChainHeads) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newShelter.pTiledLayer = boundaryObj.pTiledLayer;
    newShelter.tileDiscretePos = boundaryObj.tileDiscretePos;
    if (null != boundaryObj.imageObject) {
      newShelter.imageObject = boundaryObj.imageObject;
      newShelter.tailOrHead = "head";
    }
    newShelter.boundaryObj = boundaryObj;
    mapScriptIns.node.addChild(newShelter);
  }


  //for type3NPC 
  for (let boundaryObj of extractedBoundaryObjs.restaurants) {
    const newBarrier = cc.instantiate(mapScriptIns.polygonBoundaryRestaurantPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newBarrier.setPosition(newBoundaryOffsetInMapNode);
    newBarrier.setAnchorPoint(cc.v2(0, 0));
    const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
    newBarrierColliderIns.points = [];
    for (let p of boundaryObj) {
      newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.node.addChild(newBarrier);
  }

  mapScriptIns.barrierColliders = [];
  for (let boundaryObj of extractedBoundaryObjs.barriers) {
    const newBarrier = cc.instantiate(mapScriptIns.polygonBoundaryBarrierPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newBarrier.setPosition(newBoundaryOffsetInMapNode);
    newBarrier.setAnchorPoint(cc.v2(0, 0));
    const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
    newBarrierColliderIns.points = [];
    for (let p of boundaryObj) {
      newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.barrierColliders.push(newBarrierColliderIns);
    mapScriptIns.node.addChild(newBarrier);
  }

  for (let boundaryObj of extractedBoundaryObjs.transparents) {
    const newTransparent = cc.instantiate(mapScriptIns.polygonBoundaryTransparentPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newTransparent.setPosition(newBoundaryOffsetInMapNode);
    newTransparent.setAnchorPoint(cc.v2(0, 0));
    const newTransparentColliderIns = newTransparent.getComponent(cc.PolygonCollider);
    newTransparentColliderIns.points = [];
    for (let p of boundaryObj) {
      newTransparentColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    newTransparent.pTiledLayer = boundaryObj.pTiledLayer;
    newTransparent.tileDiscretePos = boundaryObj.tileDiscretePos;
    mapScriptIns.node.addChild(newTransparent);
  }

  for (let boundaryObj of extractedBoundaryObjs.sheltersZReducer) {
    const newShelter = cc.instantiate(mapScriptIns.polygonBoundaryShelterZReducerPrefab);
    const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
    newShelter.setPosition(newBoundaryOffsetInMapNode);
    newShelter.setAnchorPoint(cc.v2(0, 0));
    const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
    newShelterColliderIns.points = [];
    for (let p of boundaryObj) {
      newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
    }
    mapScriptIns.node.addChild(newShelter);
  }

  const allLayers = tiledMapIns.getLayers();
  for (let layer of allLayers) {
    const layerType = layer.getProperty("type");
    switch (layerType) {
      case "barrier_and_shelter":
        setLocalZOrder(layer.node, 3);
        break;
      case "shelter_preview":
        layer.node.opacity = 100;
        setLocalZOrder(layer.node, 500);
        break;
      default:
        break;
    }
  }

  const allObjectGroups = tiledMapIns.getObjectGroups();
  for (let objectGroup of allObjectGroups) {
    const objectGroupType = objectGroup.getProperty("type");
    switch (objectGroupType) {
      case "barrier_and_shelter":
        setLocalZOrder(objectGroup.node, 3);
        break;
      default:
        break;
    }
  }
}

TileCollisionManager.prototype.isOutOfMapNode = function(tiledMapNode, continuousPosLocalToMap) {
  var tiledMapIns = tiledMapNode.getComponent(cc.TiledMap); // This is a magic name.

  var mapOrientation = tiledMapIns.getMapOrientation();
  var mapTileRectilinearSize = tiledMapIns.getTileSize();

  var mapContentSize = cc.size(tiledMapIns.getTileSize().width * tiledMapIns.getMapSize().width, tiledMapIns.getTileSize().height * tiledMapIns.getMapSize().height);

  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return true;

    case cc.TiledMap.Orientation.ISO:
      var continuousObjLayerOffset = this.continuousMapNodePosToContinuousObjLayerOffset(tiledMapNode, continuousPosLocalToMap);
      return 0 > continuousObjLayerOffset.x || 0 > continuousObjLayerOffset.y || mapContentSize.width < continuousObjLayerOffset.x || mapContentSize.height < continuousObjLayerOffset.y;

    default:
      return true;
  }
  return true;
};

TileCollisionManager.prototype.cameraIsOutOfGrandBoundary = function(tiledMapNode, continuousPosLocalToMap) {
  var tiledMapIns = tiledMapNode.getComponent(cc.TiledMap);

  var mapOrientation = tiledMapIns.getMapOrientation();
  var tileRectilinearSize = tiledMapIns.getTileSize();
  let rhombus = null;
  switch (mapOrientation) {
    case cc.TiledMap.Orientation.ORTHO:
      // TODO
      return true;

    case cc.TiledMap.Orientation.ISO:
      if (!window.grandBoundary || 3 > window.grandBoundary.length) {
        rhombus = [
          cc.v2(-(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x), 0),
          cc.v2(0, -(tiledMapNode.getContentSize().height * tiledMapNode.getAnchorPoint().y)),
          cc.v2(+(tiledMapNode.getContentSize().width * tiledMapNode.getAnchorPoint().x), 0),
          cc.v2(0, +(tiledMapNode.getContentSize().height * tiledMapNode.getAnchorPoint().y)),
        ];
      } else {
        rhombus = window.grandBoundary;
      }
      return !cc.Intersection.pointInPolygon(continuousPosLocalToMap, rhombus);

    default:
      return true;
  }
  return true;
};

window.tileCollisionManager = new TileCollisionManager();
window.flyAndFade = function(nodeRightUnderMapNode, endPointNodeOnWidgetsAboveAll, widgetsAboveAllNode, durationSeconds, shouldFadeIn, shouldFadeOut, cb) {
  //将node转移到widgetsAboveAllNode下 
  const nodePosInWorld = nodeRightUnderMapNode.convertToWorldSpaceAR(cc.v2(0, 0));
  const nodePosInWidgetAboveAllNode = widgetsAboveAllNode.convertToNodeSpaceAR(nodePosInWorld);
  nodeRightUnderMapNode.parent = widgetsAboveAllNode;
  nodeRightUnderMapNode.setPosition(nodePosInWidgetAboveAllNode);
  nodeRightUnderMapNode.opacity = 255;
  nodeRightUnderMapNode.setScale(1 / widgetsAboveAllNode.scale);
  let bufferedTargetPos = endPointNodeOnWidgetsAboveAll.position;
  const opacity = shouldFadeIn ? 255 : 0;
  const movementSpawn = cc.spawn(
    cc.moveTo(durationSeconds, bufferedTargetPos),
    cc.fadeTo(durationSeconds, opacity),
  );
  const moveAndCallback = cc.sequence(
    movementSpawn,
    cc.callFunc(() => {
      if (cb) cb();
    })
  );
  nodeRightUnderMapNode.runAction(moveAndCallback);
};

window.currentlyShowingQuantityLimitPopup = undefined;

window.removeCurrentlyShowingQuantityLimitPopup = function() {
  if (!window.currentlyShowingQuantityLimitPopup) {
    return;
  }
  window.currentlyShowingQuantityLimitPopup.active = false;
  window.currentlyShowingQuantityLimitPopup = undefined;
};

window.showQuantityLimitPopup = function(quantityLimitPopup) {
  if (!quantityLimitPopup.getComponent("QuantityLimitPopup")) {
    return;
  }
  if (window.currentlyShowingQuantityLimitPopup) {
    window.currentlyShowingQuantityLimitPopup.active = false;
  }
  quantityLimitPopup.active = true;
  window.currentlyShowingQuantityLimitPopup = quantityLimitPopup;
};
