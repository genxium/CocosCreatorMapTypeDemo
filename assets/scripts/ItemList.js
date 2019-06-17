cc.Class({
  extends: cc.Component,
  properties: {
    itemPrefab: {
      type: cc.Prefab,
      default: null,
    },
    itemCellPrefab: {
      type: cc.Prefab,
      default: null,
    },
    cellCount: 3,
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  onLoad() {
    const self = this;
    self.node.removeAllChildren();
    for (let i = 0; i < self.cellCount; i++) {
      let cellNode = cc.instantiate(self.itemCellPrefab);
      safelyAddChild(self.node, cellNode);
    }
  },

  refreshItemList(itemListData) {
    const self = this, cells = self.node.children;
    self.emptyCells();
    itemListData.forEach((itemData, index) => {
      if (index >= cells.length) {
        cc.warn('Item cell not enough, max is', self.cellCount);
        return;
      }
      let itemNode = cc.instantiate(self.itemPrefab);
      let itemIns = itemNode.getComponent('Item');
      itemIns.init(self.mapIns);
      itemIns.setData(itemData);
      safelyAddChild(cells[index], itemNode);
    });
  },

  emptyCells() {
    const self = this, cells = self.node.children;
    for (let i = 0; i < cells.length; i++) {
      cells[i].removeAllChildren();
    }
  },

})
