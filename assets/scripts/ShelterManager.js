let inPreviewGIDCache = {};

window.CORE_LAYER_Z_INDEX = {
  PLAYER: 5,
  IMAGE_OBJ: 5,
  THE_BUTTON: 15,
  STATEFUL_BUILDABLE_INSTANCE_HIGHLIGHTER_LAYER: 99,
  UN_HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE: 1,
  HIGHLIGHTED_STATEFUL_BUILDABLE_INSTANCE: 100,
};

window.RESTAURANT_CORE_LAYER_Z_INDEX = {
  UPGRADING_FRAME_ANIM: 10,
  OTHER_FRAME_ANIM: 2,
  TABLES_AND_CHAIRS: 3,
  DISH_ON_TABLE: 10,
};

window._hideExistingShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const existingGID = withinTiledLayer.getTileGIDAt(tilePos.x, tilePos.y);
  withinTiledLayer.setTileGIDAt(0, tilePos.x, tilePos.y);
  return existingGID;
};

window._unhideExistingShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  const theSubCache = inPreviewGIDCache[withinTiledLayer.uuid];
  if (null == theSubCache) return;
  const gid = theSubCache[tilePos.toString()];
  if (null == gid) return;
  withinTiledLayer.setTileGIDAt(gid, tilePos.x, tilePos.y);
};

window.previewShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);

  const shelterPreviewLayer = tiledMapIns.getLayer("ShelterPreview");
  if (!shelterPreviewLayer) return;
  const gid = window._hideExistingShelter(mapScriptIns, mapNode, withinTiledLayer, tilePos);
  if (null == gid || 0 == gid) return;

  if (null == inPreviewGIDCache[withinTiledLayer.uuid]) {
    inPreviewGIDCache[withinTiledLayer.uuid] = {};
  }

  inPreviewGIDCache[withinTiledLayer.uuid][tilePos.toString()] = gid;

  const theTex = withinTiledLayer.getTexture();
  const theTileSet = withinTiledLayer.getTileSet();
  shelterPreviewLayer.setTileSet(theTileSet);
  shelterPreviewLayer.setTexture(theTex);
  shelterPreviewLayer.setTileGIDAt(gid, tilePos.x, tilePos.y);
};

window.cancelPreviewingOfShelter = function(mapScriptIns, mapNode, withinTiledLayer, tilePos) {
  if (!withinTiledLayer) return;
  const tiledMapIns = mapNode.getComponent(cc.TiledMap);
  const shelterPreviewLayer = tiledMapIns.getLayer("ShelterPreview");
  if (!shelterPreviewLayer) return;

  shelterPreviewLayer.setTileGIDAt(0, tilePos.x, tilePos.y);
  _unhideExistingShelter(mapScriptIns, mapNode, withinTiledLayer, tilePos);
};

class ShelterChainVertice {
  constructor() {
    this.id = null; 
		this.ccNode = null;
    this.prependedVertices = {};    
    this.appendedVertices = {};    
    this.layerIndex = 0;
    this.isGlueVertice = false;
  }

  appendVertice(newVertice) {
    /*
    * If hereby "true == this.prependedVertices.hasOwnProperty(newVertice.id)", then a short "cycle" is formed. 
    */
		if (this.appendedVertices.hasOwnProperty(newVertice.id)) {
			return false;
		}	
		this.appendedVertices[newVertice.id] = newVertice;
		newVertice.prependedVertices[this.id] = this;
    return true;
  } 

  removeAppendedVertice(existingVertice) {
		if (false == this.appendedVertices.hasOwnProperty(existingVertice.id)) {
			return false;
		}	
		delete this.appendedVertices[existingVertice.id]; 
		delete existingVertice.prependedVertices[this.id];
    return true;
  }
}

let globalShelterChainVerticeMap = {};
window.globalShelterChainVerticeMap = globalShelterChainVerticeMap;

window.addToGlobalShelterChainVerticeMap = function(theCcNode) {
	const theId = theCcNode.uuid;
	if (globalShelterChainVerticeMap.hasOwnProperty(theId)) {
		return false;
	}
	const newVertice = new ShelterChainVertice(); 
	newVertice.id = theId;
	newVertice.ccNode = theCcNode;
	globalShelterChainVerticeMap[theId] = newVertice; 
	return true;
}

window.removeFromGlobalShelterChainVerticeMap = function(theCcNode) {
	const theId = theCcNode.uuid;
	const theVertice = globalShelterChainVerticeMap[theId]; 
	if (null == theVertice) {
		return false;
	}

	for (let k in theVertice.appendedVertices) {
		const theAppendedVertice = theVertice.appendedVertices[k];  
		delete theAppendedVertice.prependedVertices[theVertice.id];
	}

	for (let k in theVertice.prependedVertices) {
		const thePrependedVertice = theVertice.prependedVertices[k];
		delete thePrependedVertice.appendedVertices[theVertice.id];
	} 

	delete globalShelterChainVerticeMap[theId];
	return true;
}

window.isUpdatingShelterChainLayerIndex = false;
window.updateLayerIndex = function(verticeMap) {
	if (null == verticeMap) {
		return false;
	}

	if (window.isUpdatingShelterChainLayerIndex) {
		return false;
	}

  window.isUpdatingShelterChainLayerIndex = true;

	let queue = [];
	let roots = {};
	for (let k in globalShelterChainVerticeMap) {
		const theVertice = globalShelterChainVerticeMap[k];	
		if (0 < Object.keys(theVertice.prependedVertices).length) continue;
		roots[theVertice.id] = theVertice;
		theVertice.layerIndex = 0;	
		queue.push(theVertice);
	}

	const maxIterationCount = 50000;
	let currentIterationCount = 0;
	while (0 < queue.length) {
		const thatVertice = queue.pop();
		++currentIterationCount;
		if (currentIterationCount > maxIterationCount) {
			cc.warn(`Within "updateLayerIndex", currentIterationCount == ${currentIterationCount} exceeds maxIterationCount == ${maxIterationCount}. Force breaking...`);
			break;
		}
		for (let k in thatVertice.appendedVertices) {
      if (thatVertice.prependedVertices.hasOwnProperty(k)) {
        // A dirty hack to avoid obvious "cycle".
        continue;
      }
			const theAppendedVertice = thatVertice.appendedVertices[k];  	
			const candidateLayerIndex = (1 + thatVertice.layerIndex);
			theAppendedVertice.layerIndex = (theAppendedVertice.layerIndex > candidateLayerIndex ? theAppendedVertice.layerIndex : candidateLayerIndex);
			queue.push(theAppendedVertice);
		}	
	}

	for (let k in globalShelterChainVerticeMap) {
		const theVertice = globalShelterChainVerticeMap[k];	
		if (null == theVertice.ccNode.origZIndex) continue;
		setLocalZOrder(theVertice.ccNode, (theVertice.ccNode.origZIndex + theVertice.layerIndex)); 
	}

  window.isUpdatingShelterChainLayerIndex = false;
  return true;
}
