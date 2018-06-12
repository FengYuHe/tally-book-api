'use strict';
const path = require('path');

module.exports = async function (app) {
  // 初始化收入和支出分类
  const incomeCategory = require(path.join(__dirname, '../files/default-income-category.js'));
  const expendCategory = require(path.join(__dirname, '../files/default-expend-category.js'));
  await initCategory(incomeCategory, 'Income');
  await initCategory(expendCategory, 'Expend');

  async function initCategory(data, type, parentId) {
    for (let i = 0; i < data.length; i++) {
      const parent = await app.models.Category.upsertWithWhere({id: data[i].id}, Object.assign(data[i], {parentId, type}));
      if (data[i].children && data[i].children.length !== 0) {
        await initCategory(data[i].children, type, parent.id)
      }
    }
  }
};
