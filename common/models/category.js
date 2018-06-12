'use strict';

module.exports = function(Category) {
  Category.getCategoryForMobile = async function (type) {
    type = type || 'Expend';
    const category = await Category.find({where: {level: 1, type}, order: 'sequence asc'});
    for (let i = 0; i < category.length; i++) {
      category[i].children = await Category.find({where: {parentId: category[i].id}, order: 'sequence asc'});
    }
    return category;
  };

  Category.remoteMethod('getCategoryForMobile', {
    description: '手机端查询分类',
    accepts: [
      {arg: 'type', type: 'string', required: true, description: 'Income-收入 Expend(default)-支出'},
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'get', path: '/mobile/parent'},
  });
};
