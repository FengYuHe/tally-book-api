'use strict';

const _ = require('lodash');
const PromiseA = require('bluebird');

module.exports = function (app, done) {
  const dataSources = _(app.datasources).values().uniq().value();
  PromiseA.each(dataSources, ds => ds.autoupdate && ds.autoupdate()).then(async () => {
    // initFixtures(app);
  }).asCallback(done);
};

function initFixtures(app) {
  if (app.enabled('skipInitFixtures')) {
    return;
  }
  const {ManagementAccount, Role, RoleMapping, Product} = app.models;
  return PromiseA.all([
    // create global admin role
    // PromiseA.fromCallback(cb => Role.findOrCreate({where: {or: [{name: 'admin'}, {name: 'stuff'}]}}, [{name: 'admin'}, {name: 'stuff'}], cb)),
    PromiseA.fromCallback(cb => Role.upsertWithWhere({name: 'admin'}, {name: 'admin', description: '系统管理员'}, cb)),
    // create global admin user - find or create use loopback style to avoid use OptimizedFindOrCreate
    _findOrCreate(ManagementAccount, {where: {username: 'admin'}}, {
      username: 'admin',
      fullname: 'Administrator',
      password: 'mmp0ss'
    }),
    PromiseA.fromCallback(cb => Role.upsertWithWhere({name: 'user'}, {name: 'user', description: '注册用户'}, cb)),
    PromiseA.fromCallback(cb => Role.upsertWithWhere({name: 'operator'}, {
      name: 'operator',
      description: '运营人员'
    }, cb))
  ]).then(async ([adminRole, adminUser, userRole, operatorRole]) => {
    app.roleUser = userRole;
    app.roleAdmin = adminRole;
    app.roleOperator = operatorRole;
    app.product = product;
    let roleMapping = await RoleMapping.findOne({
      where: {
        principalType: app.models.RoleMapping.USER,
        principalId: adminUser[0].id,
        roleId: adminRole.id
      }
    });
    if (!roleMapping)
      await adminRole.principals.create({principalType: RoleMapping.USER, principalId: adminUser[0].id});

    return;
  });
}

async function createDefaultWords(app) {
  // const defaultWords = app.get('defaultWords');
  // for (let i = 0; i < defaultWords.length; i++) {
  //   await app.models.DesignDefaultWord.findOrCreate({where: defaultWords[i]}, defaultWords[i]);
  // }
}

// find or create use loopback style to avoid use OptimizedFindOrCreate
function _findOrCreate(Model, query, data, options) {
  return Model.findOne(query, options).then(record => {
    if (record) return [record, false];
    return Model.create(data, options).then(record => {
      return [record, !_.isNil(record)];
    });
  });
}
