const i18n = require('LanguageData');

cc.Class({
  extends: cc.Component,

  properties: {
    hintLabel: {
      type: cc.Label,
      default: null,
    },
    thePgrBar: {
      type: cc.ProgressBar,
      default: null,
    },
    startedAtMillis: {
      default: 0,
    },
    durationMillis: {
      default: 0,
    },
    onCompleted: {
      type: cc.Object,
      default: null,
    },
    onProgressUpdate: {
      type: cc.Object,
      default: null,
    },
    onProgressChanged: {
      type: cc.Object,
      default: null,
    },
    boostButton: {
      type: cc.Button,
      default: null,
    },
    musicEffect: {
      type: cc.AudioClip,
      default: null,
    },
  },

  onLoad() {
    const self = this;
  },

  setData(startedAtMillis, durationMillis) {
    this.node.active = true;
    this.startedAtMillis = startedAtMillis;
    this.durationMillis = durationMillis;
  },
  playMusicEffect(evt) {
    if (this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
  },
  update(dt) {
    const self = this;
    if (!self.node.active) {
      return;
    }
    const currentGMTMillis = Date.now();
    const elapsedMillis = (currentGMTMillis - self.startedAtMillis);
    let remainingMillis = (self.durationMillis - elapsedMillis);
    if (remainingMillis <= 0)
      remainingMillis = 0;

    let currentProgress = parseFloat(elapsedMillis) / self.durationMillis;
    if (1 <= currentProgress)
      currentProgress = 1.0;
    currentProgress = new Number(currentProgress);

    if (0.001 < (currentProgress - self.thePgrBar.progress)) {
      self.thePgrBar.progress = currentProgress;
      self.onProgressChanged && self.onProgressChanged(currentProgress, remainingMillis);
    }

    let remainingSeconds = parseInt(remainingMillis / constants.TIME_CHUNK.MILLIS_IN_SECOND);
    const hintStr = secondsToNaturalExp(remainingSeconds);
    self.hintLabel.string = hintStr;

    if (1 <= currentProgress) {
      self.node.active = false;
      self.onCompleted && self.onCompleted();
    }
    self.onProgressUpdate && self.onProgressUpdate(currentProgress, remainingMillis);
  }
});

