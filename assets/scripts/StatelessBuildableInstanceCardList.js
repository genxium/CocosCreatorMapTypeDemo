const CloseableDialog = require('./CloseableDialog');
const StatelessBuildableInstance = require('./StatelessBuildableInstance');

cc.Class({
  extends: CloseableDialog,
  properties: {
    listNode: {
      type: cc.Node,
      default: null,
    },
    statelessBuildableInstanceCardPrefab: {
      type: cc.Prefab,
      default: null,
    }
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },
  
  refreshStatelessBuildableInstanceCardListNode(mapIns, allStatelessBuildableInstances, ownedStatefulBuildableInstances) {
    const self = this;
    this.mapIns = mapIns;
    const statelessBuildableInstanceCardListNode = this.node;
    let initialXOffset = -200;
    const constSpacingX = 10;
    let localCount = 0;
    this.listNode.removeAllChildren();
    for (let singleStatelessBuildableInstance of allStatelessBuildableInstances) {
        const singleStatelessBuildableInstanceCardNode = cc.instantiate(this.statelessBuildableInstanceCardPrefab);
        const singleStatelessBuildableInstanceCardScriptIns = singleStatelessBuildableInstanceCardNode.getComponent("StatelessBuildableInstanceCard");
        singleStatelessBuildableInstanceCardScriptIns.init(mapIns, this, singleStatelessBuildableInstance);
        singleStatelessBuildableInstanceCardNode.setPosition(
          cc.v2(
            initialXOffset + localCount * (constSpacingX + singleStatelessBuildableInstanceCardNode.width),
            0
          )
        );
        safelyAddChild(self.listNode, singleStatelessBuildableInstanceCardNode);
        ++localCount;
    }
  },
});
