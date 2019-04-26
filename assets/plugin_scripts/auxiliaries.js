"use strict";
const i18n = require('LanguageData');

window.getRandomArbitrary = function(min, max) {
  return Math.random() * (max - min) + min;
};

window.getRandomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

window.getQueryParamDict = function() {
  // Kindly note that only the first occurrence of duplicated keys will be picked up. 
  var query = window.location.search.substring(1);
  var kvPairs = query.split('&');
  var toRet = {};
  for (var i = 0; i < kvPairs.length; ++i) {
    var kAndV = kvPairs[i].split('=');
    if (undefined === kAndV || null === kAndV || 2 != kAndV.length) return;
    var k = kAndV[0];
    var v = decodeURIComponent(kAndV[1]);
    toRet[k] = v;
  }
  return toRet;
}

window.getRandomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

window.safelyAssignParent = function(proposedChild, proposedParent) {
  if (proposedChild.parent == proposedParent) return false;
  proposedChild.parent = proposedParent;
  return true;
};

window.setLocalZOrder = function(aCCNode, zIndex) {
  aCCNode.zIndex = zIndex; // For cc2.0+ 
};

window.getLocalZOrder = function(aCCNode) {
  return aCCNode.zIndex; // For cc2.0+ 
};

window.safelyAddChild = function(proposedParent, proposedChild) {
  if (proposedChild.parent == proposedParent) return false;
  if (null != proposedChild.parent) return false;
  setLocalZOrder(proposedChild, getLocalZOrder(proposedParent) + 1);
  proposedParent.addChild(proposedChild);
  return true;
};

window.setVisible = function(aCCNode) {
  aCCNode.opacity = 255;
};

window.setInvisible = function(aCCNode) {
  aCCNode.opacity = 0;
};

window.randomProperty = function(obj) {
  var keys = Object.keys(obj)
  return obj[keys[keys.length * Math.random() << 0]];
};

window.gidSpriteFrameMap = {};
window.getOrCreateSpriteFrameForGid = function(gid, tiledMapInfo, tilesElListUnderTilesets) {
  if (null != gidSpriteFrameMap[gid]) return gidSpriteFrameMap[gid];
  if (false == gidSpriteFrameMap[gid]) return null;

  var tilesets = tiledMapInfo.getTilesets();
  var targetTileset = null;
  for (var i = 0; i < tilesets.length; ++i) {
    // TODO: Optimize by binary search.
    if (gid < tilesets[i].firstGid) continue;
    if (i < tilesets.length - 1) {
      if (gid >= tilesets[i + 1].firstGid) continue;
    }
    targetTileset = tilesets[i];
    break;
  }
  if (!targetTileset) return null;
  var tileIdWithinTileset = (gid - targetTileset.firstGid);
  var tilesElListUnderCurrentTileset = tilesElListUnderTilesets[targetTileset.name + ".tsx"];

  var targetTileEl = null;
  for (var tileIdx = 0; tileIdx < tilesElListUnderCurrentTileset.length; ++tileIdx) {
    var tmpTileEl = tilesElListUnderCurrentTileset[tileIdx];
    if (tileIdWithinTileset != parseInt(tmpTileEl.id)) continue;
    targetTileEl = tmpTileEl;
    break;
  }

  //if (!targetTileEl) return null;当tile没有custom type时，不会存储相应tile
  var tileId = tileIdWithinTileset;
  var tilesPerRow = (targetTileset.sourceImage.width / targetTileset._tileSize.width);
  var row = parseInt(tileId / tilesPerRow);
  var col = (tileId % tilesPerRow);
  var offset = cc.v2(targetTileset._tileSize.width * col, targetTileset._tileSize.height * row);
  var origSize = targetTileset._tileSize;
  var rect = cc.rect(offset.x, offset.y, origSize.width, origSize.height);
  var sf = new cc.SpriteFrame(targetTileset.sourceImage, rect, false /* rotated */ , offset, origSize);
  const data = {
    origSize: targetTileset._tileSize,
    spriteFrame: sf,
  }
  window.gidSpriteFrameMap[gid] = data;
  return data;
}
window.gidAnimationClipMap = {};
window.getOrCreateAnimationClipForGid = function(gid, tiledMapInfo, tilesElListUnderTilesets) {
  // cc.log(`getOrCreateAnimationClipForGid ${gid}`);
  if (null != gidAnimationClipMap[gid]) return gidAnimationClipMap[gid];
  if (false == gidAnimationClipMap[gid]) return null;

  var tilesets = tiledMapInfo.getTilesets();
  var targetTileset = null;
  for (var i = 0; i < tilesets.length; ++i) {
    // TODO: Optimize by binary search.
    if (gid < tilesets[i].firstGid) continue;
    if (i < tilesets.length - 1) {
      if (gid >= tilesets[i + 1].firstGid) continue;
    }
    targetTileset = tilesets[i];
    break;
  }

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, found targetTileset.firstGid == ${targetTileset.firstGid}`);
  if (!targetTileset) return null;
  var tileIdWithinTileset = (gid - targetTileset.firstGid);
  var tsxFileName = (targetTileset.name + ".tsx");
  var tilesElListUnderCurrentTileset = tilesElListUnderTilesets[tsxFileName];

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, tilesElListUnderCurrentTileset == ${tilesElListUnderCurrentTileset} whose length == ${tilesElListUnderCurrentTileset.length} for tsxFileName == ${tsxFileName}.`);

  var targetTileEl = null;
  for (var theSeqId = 0; theSeqId < tilesElListUnderCurrentTileset.length; ++theSeqId) {
    var tmpTileEl = tilesElListUnderCurrentTileset[theSeqId];
    var tileId = (cc.sys.isNative ? tmpTileEl.attributes.getNamedItem("id").nodeValue : tmpTileEl.id);
    cc.log(`getOrCreateAnimationClipForGid ${gid}, examining tmpTileEl to match tileIdWithinTileset == ${tileIdWithinTileset}.`);
    if (tileIdWithinTileset != parseInt(tileId)) continue;
    targetTileEl = tmpTileEl;
    break;
  }

  if (!targetTileEl) {
    cc.log(`getOrCreateAnimationClipForGid ${gid}, targetTileEl not found for tileIdWithinTileset == ${tileIdWithinTileset}.`);
    return null;
  }
  var animElList = targetTileEl.getElementsByTagName("animation");
  if (!animElList || 0 >= animElList.length) {
    cc.log(`getOrCreateAnimationClipForGid ${gid}, tagname "animation" not located within targetTileEl.`);
    return null;
  }
  var animEl = animElList[0];

  var uniformDurationSecondsPerFrame = null;
  var totDurationSeconds = 0;
  var sfList = [];
  var frameElListUnderAnim = animEl.getElementsByTagName("frame");
  var tilesPerRow = (targetTileset.sourceImage.width / targetTileset._tileSize.width);

  // cc.log(`getOrCreateAnimationClipForGid ${gid}, got the first animEl and frameElListUnderAnim == ${frameElListUnderAnim}.`);
  for (var k = 0; k < frameElListUnderAnim.length; ++k) {
    var frameEl = frameElListUnderAnim[k];
    var tileId = (cc.sys.isNative ? parseInt(frameEl.attributes.getNamedItem("tileid").nodeValue) : parseInt(frameEl.attributes.tileid.value));
    var durationSeconds = (cc.sys.isNative ? (parseFloat(frameEl.attributes.getNamedItem("duration").nodeValue) / 1000) : (frameEl.attributes.duration.value / 1000));
    if (null == uniformDurationSecondsPerFrame) {
      uniformDurationSecondsPerFrame = durationSeconds;
    }
    totDurationSeconds += durationSeconds;
    var row = parseInt(tileId / tilesPerRow);
    var col = (tileId % tilesPerRow);
    var offset = cc.v2(targetTileset._tileSize.width * col, targetTileset._tileSize.height * row);
    var origSize = targetTileset._tileSize;
    var rect = cc.rect(offset.x, offset.y, origSize.width, origSize.height);
    var sf = new cc.SpriteFrame(targetTileset.sourceImage, rect, false /* rotated */ , offset, origSize);
    cc.log(`Cropped SpriteFrame from targetTileset.sourceImage == ${targetTileset.sourceImage} by rect == ${rect}, offset == ${offset} and origSize == ${origSize}.`);
    sfList.push(sf);
  }
  var sampleRate = 1 / uniformDurationSecondsPerFrame; // A.k.a. fps.
  var animClip = cc.AnimationClip.createWithSpriteFrames(sfList, sampleRate);
  // http://docs.cocos.com/creator/api/en/enums/WrapMode.html.
  animClip.wrapMode = cc.WrapMode.Loop;
  return {
    origSize: targetTileset._tileSize,
    animationClip: animClip,
  };
};

window.secondsToNaturalExp = function(remainingSeconds, isNormalExp) {
  if (remainingSeconds < 1 && remainingSeconds >= 0) {
    return isNormalExp ? cc.js.formatStr(i18n.t("durationInNormal.seconds"), 0) : cc.js.formatStr(i18n.t("duration.seconds"), 0); //防止不必要的小数溢出
  }
  const toDisplayDays = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_DAY);
  remainingSeconds -= (toDisplayDays * constants.TIME_CHUNK.SECONDS_IN_DAY);
  const toDisplayHours = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_HOUR);
  remainingSeconds -= (toDisplayHours * constants.TIME_CHUNK.SECONDS_IN_HOUR);
  const toDisplayMinutes = parseInt(remainingSeconds / constants.TIME_CHUNK.SECONDS_IN_MINUTE);
  remainingSeconds -= (toDisplayMinutes * constants.TIME_CHUNK.SECONDS_IN_MINUTE);
  let hintStrDays = "";
  let hintStrHours = "";
  let hintStrSeconds = "";
  let hintStrMinutes = "";
  if (isNormalExp) {
    hintStrDays = (0 < toDisplayDays ? cc.js.formatStr(i18n.t("durationInNormal.days") + " ", toDisplayDays) : "");
    hintStrHours = ((0 < toDisplayHours) ? cc.js.formatStr(i18n.t("durationInNormal.hours") + " ", toDisplayHours) : "");
    hintStrMinutes = ((0 < toDisplayMinutes) ? cc.js.formatStr(i18n.t("durationInNormal.minutes") + " ", toDisplayMinutes) : "");
    hintStrSeconds = ((0 < remainingSeconds) ? cc.js.formatStr(i18n.t("durationInNormal.seconds"), remainingSeconds) : "");
  } else {
    hintStrDays = (0 < toDisplayDays ? cc.js.formatStr(i18n.t("duration.days") + " ", toDisplayDays) : "");
    hintStrHours = ((0 < toDisplayHours) ? cc.js.formatStr(i18n.t("duration.hours") + " ", toDisplayHours) : "");
    hintStrMinutes = ((0 < toDisplayMinutes) ? cc.js.formatStr(i18n.t("duration.minutes") + " ", toDisplayMinutes) : "");
    hintStrSeconds = ((0 < remainingSeconds) ? cc.js.formatStr(i18n.t("duration.seconds"), Math.floor(remainingSeconds)) : "" );
  }
  const hintStr = [hintStrDays, hintStrHours, hintStrMinutes, hintStrSeconds].join('');
  return hintStr;
};
window._base64ToUint8Array = function(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

window._base64ToArrayBuffer = function(base64) {
  return _base64ToUint8Array(base64).buffer;
}

window.transformArrayBufferToBase64 = function(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var len = bytes.byteLength, i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

window.pbEncodeData = (struct, payLoad) => {
  const message = struct.create(payLoad);
  const encodedMessage = struct.encode(message).finish();
  return transformArrayBufferToBase64(encodedMessage);
};

window.pbDecodeData = (struct, data) => {
  const unitArrayData = _base64ToUint8Array(data);
  return struct.decode(unitArrayData);
};
