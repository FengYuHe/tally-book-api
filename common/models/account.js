'use strict';
const g = require('strong-globalize')();
const rp = require('request-promise');

module.exports = function(Account) {
  Account.loginForWechat = async function (data) {
    if (!data.code) {
      const err = new Error(g.f('code is required'));
      err.statusCode = 400;
      err.code = 'REALM_REQUIRED';
      throw err;
    }
    const config = Account.app.get('miniWechat');
    let result = await rp(`${config.login}?appid=${config.appid}&secret=${config.appSecret}&js_code=${data.code}&grant_type=authorization_code`);
    result = JSON.parse(result);
    if (result.errcode) {
      const err = new Error(g.f(result.errmsg));
      err.statusCode = 400;
      err.code = result.errcode;
      throw err;
    }
    const d = {
      openid: result.openid,
      password: result.openid,
      avatar: data.avatarUrl || '',
      city: data.city || '',
      country: data.country || '',
      gender: data.gender,
      nickname: data.nickName
    };
    const account = await Account.upsertWithWhere({openid: d.openid}, d);
    return account.createAccessToken({
      scopes: ['DEFAULT', 'account']
    }, d);
  };

  Account.me = async function (options) {
    const user = await Account.findById(options.accessToken.userId);
    if (!user) {
      throw new Error('账号不存在');
    }
    return user;
  };

  Account.remoteMethod('loginForWechat', {
    description: '微信小程序登陆',
    accepts: [{
      arg: 'data', type: 'object', required: true, http: {source: 'body'}
    }],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'post', path: '/login/wechat'},
  });

  Account.remoteMethod('me', {
    description: '获取自己的信息',
    accessType: 'READ',
    accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}],
    returns: {arg: 'result', type: 'object', root: true},
    http: {verb: 'get', path: '/me'},
  });
};
