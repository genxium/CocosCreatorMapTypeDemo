cc.Class({
  extends: cc.Component,

  properties: {
    animationDurationMillis: {
      default: 4000,
    },
    indicatorLabel: {
      type: cc.Label,
      default: null,
    },
    progressBar: {
      type: cc.ProgressBar,
      default: null,
    },
    instantStart: {
      default: false,
    },
    isForElapsedTimeProgress: {
      default: false,
    },
    eps: 0.001,
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    this.startedAtMillis = null;
    this.currentlyDisplayingQuantity = null;
    this.targetQuantity = null;
    this.maxValue = null;
    this.previousMaxValue = null;
    if (this.isForElapsedTimeProgress) {
      this.animationDurationMillis = 1000;
    }
  },

  onLoad() {},

  setData(targetQuantity, maxValue, specifiedStartedAtMillis) {
    this.previousMaxValue = this.maxValue;
    this.maxValue = maxValue;
    this.targetQuantity = targetQuantity;

    this.toBeAnimatedProgressDistance = Math.abs(this.targetQuantity - this.currentlyDisplayingQuantity);

    if (null == specifiedStartedAtMillis) {
      if (this.isForElapsedTimeProgress) {
        this.startedAtMillis = Date.now();
      }
    } else {
      this.startedAtMillis = specifiedStartedAtMillis;
    }
    if (this.isForElapsedTimeProgress) {
      this.targetQuantity = (Date.now() - this.startedAtMillis); // Overwriting the previous assignment.
      this.currentlyDisplayingQuantity = 0;
      this.toBeAnimatedProgressDistance = Math.abs(this.targetQuantity - this.currentlyDisplayingQuantity); // Overwriting the previous assignment.
    }
  },

  formulateIndicatorLabelStr() {
    if (this.isforelapsedtimeprogress) {
      const elapsedMillis = this.targetQuantity;
      const durationMillis = this.maxValue;
      let remainingMillis = (durationMillis - elapsedMillis);
      if (remainingMillis <= 0) {
        remainingMillis = 0;
      }
      return window.secondsToNaturalExp(remainingMillis / 1000);
    } else {
      if(this.progressBar.progress <= 1 ){
        return Math.floor(this.currentlyDisplayingQuantity);
      }else {
        return Math.floor(this.maxValue);
      }
    }
  },

  update(dt) {
    if (this.dt) {
      dt = this.dt;
    }
    let diffQuantity = (this.targetQuantity - this.currentlyDisplayingQuantity);
    if (this.eps > Math.abs(diffQuantity) && this.previousMaxValue == this.maxValue) {
      // An early return for most cases.
      return;
    }

    if (null == this.currentlyDisplayingQuantity) {
      if (this.instantStart) {
        this.currentlyDisplayingQuantity = this.targetQuantity;
      }
    }
    diffQuantity = (this.targetQuantity - this.currentlyDisplayingQuantity);
    const sign = (diffQuantity > 0 ? +1 : -1);
    let newSign = sign;
    let newCurrentlyDisplayingQuantity = this.targetQuantity;
    if (this.isForElapsedTimeProgress) {
      newCurrentlyDisplayingQuantity = this.currentlyDisplayingQuantity + sign * diffQuantity;
      newSign = (this.targetQuantity - newCurrentlyDisplayingQuantity) > 0 ? +1 : -1;
    } else {
      const animatedQuantityDiffPerSecond = (this.toBeAnimatedProgressDistance / this.animationDurationMillis) * 1000;

      newCurrentlyDisplayingQuantity = this.currentlyDisplayingQuantity + sign * (animatedQuantityDiffPerSecond * dt);
      newSign = (this.targetQuantity - newCurrentlyDisplayingQuantity) > 0 ? +1 : -1;
    }
    if (newSign != sign) {
      this.currentlyDisplayingQuantity = this.targetQuantity;
    } else {
      this.currentlyDisplayingQuantity = newCurrentlyDisplayingQuantity;
    }
    this.progressBar.progress = (this.currentlyDisplayingQuantity / this.maxValue);
    this.indicatorLabel.string = this.formulateIndicatorLabelStr();
    if (this.isForElapsedTimeProgress) {
      this.targetQuantity += (dt * 1000); // In this case, `this.targetQuantity` is just the elapsedMillis. 
    }
    this.previousMaxValue = this.maxValue;
  },
});

