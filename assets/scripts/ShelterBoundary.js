cc.Class({
  extends: cc.Component,

  // LIFE-CYCLE CALLBACKS:

  onLoad() {},

  start() {
    this.contactedPlayersCount = 0;
  },

  update(dt) {},

  onCollisionEnter(other, selfCollider) {
    const self = this;
    const isPlayer = (-1 != other.node.name.indexOf("Player")) ? true : false;
    if (isPlayer) {
      if (0 == this.contactedPlayersCount) {
        if (this.node.spriteNode) {
          setLocalZOrder(this.node.spriteNode, 15);
        }
      }
      this.contactedPlayersCount++;
    }
  },

  onCollisionExit(other, selfCollider) {
    const isPlayer = (-1 != other.node.name.indexOf("Player")) ? true : false;
    if (isPlayer) {
      if (1 == this.contactedPlayersCount) {
        if (this.node.spriteNode) {
          setLocalZOrder(this.node.spriteNode, 5);
        }
      }
      this.contactedPlayersCount--;
    }
  },
});
