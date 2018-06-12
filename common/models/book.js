'use strict';
const g = require('strong-globalize')();

module.exports = function(Book) {
  Book.createBook = async function (name, cover, description, options) {
    const accountId = options.accessToken.userId;
    const count = await Book.count({ownerId: accountId});
    if (count && count >= 5) {
      const err = new Error(g.f('暂时没人最多创建5个记账本'));
      err.statusCode = 400;
      throw err;
    }
    return Book.create({name, cover, description, ownerId: accountId});
  };

  Book.updateBook = async function (id, name, cover, description, options) {
    const accountId = options.accessToken.userId;
    const book = await Book.findById(id);
    if (!book) {
      const err = new Error(g.f('记账本不存在'));
      err.statusCode = 400;
      throw err;
    }
    if (book.ownerId !== accountId) {
      const err = new Error(g.f('无权限修改此账本'));
      err.statusCode = 400;
      throw err;
    }
    const data = {};
    name ? data.name = name : null;
    cover ? data.cover = cover : null;
    description ? data.description = description : null;
    return book.updateAttributes(data);
  };

  Book.getOwnerBook = async function (filter, options) {
    const accountId = options.accessToken.userId;
    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.ownerId = accountId;
    // TODO 查询参与角色的账本
    return Book.find(filter);
  };

  Book.remoteMethod('createBook', {
    description: '创建记账本',
    accepts: [
      {arg: 'name', type: 'string', required: true, description: '名称'},
      {arg: 'cover', type: 'string', required: false, description: '封面'},
      {arg: 'description', type: 'string', required: false, description: '描述'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'post', path: '/'},
  });

  Book.remoteMethod('updateBook', {
    description: '修改记账本',
    accepts: [
      {arg: 'id', type: 'string', required: true, description: '唯一id'},
      {arg: 'name', type: 'string', required: false, description: '名称'},
      {arg: 'cover', type: 'string', required: false, description: '封面'},
      {arg: 'description', type: 'string', required: false, description: '描述'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'put', path: '/:id'},
  });

  Book.remoteMethod('getOwnerBook', {
    description: '获取自己的记账本',
    accepts: [
      {
        arg: 'filter', type: 'object',
        description: 'Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"something":"value"})'
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'get', path: '/owner'},
  });
};
