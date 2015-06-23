var config = require('../config');
var _ = require('underscore');
// AV
var Avos = require('avoscloud-sdk').AV;
Avos._initialize(config.AvosAppID, config.AvosAppkey, config.AvosMasterKey);
Avos.Cloud.useMasterKey();

var user = Avos.Object.extend('user');
var goods = Avos.Object.extend('goods');

exports.getUserByAccount = function(account, password, callback)
{
	var query = new Avos.Query(user);
	query.equalTo('account', account).equalTo('password', password).find({
		success : function(user){
			if(user[0])
				callback(null,user[0]);
			else
				callback(null,null);
		},
		error : function(){
			callback(err);
		}
	});

}

exports.getBackground = function(account, callback)
{
	var query = new Avos.Query(user);
	query.equalTo('account', account).find({
		success : function(user){
			if(user[0] && user[0].get('background'))
				callback(null, user[0].get('background'));
			else
				callback(null, null);
		},
		error : function(err){
			callback(err);
		}
	});
}

exports.setBackground = function(account, background, callback)
{
	var query = new Avos.Query(user);
	query.equalTo('account', account).find({
		success : function(user){
			if(user[0])
			{
				user[0].set('background', background);
				user[0].save(null, {
					success : function(user){
						callback(null, 'true');
					},
					error : function(uer, err){
						callback(err);
					}
				});
			}
			else
				callback(null, 'false');
		},
		error : function(err){
			callback(err);
		}
	});
}

exports.saveGood = function(account, product, callback)
{
	var query = new Avos.Query(goods);
	query.equalTo('account', account).equalTo('objectId', product.objId).find({
		success : function(good){
			if(good[0])
			{
				good[0].set('otherAttri', product.otherAttri);
				good[0].set('otherValue', product.otherValue);
				good[0].set('value', product.value);
				good[0].set('size', product.size);
				good[0].set('type', product.type);
				good[0].set('large', product.large);
				good[0].save(null, {
					success : function(good){
						callback(null, 'true');
					},
					error : function(good, err){
						callback(err);
					}
				});
			}
			else
				callback(null, 'false');
		},
		error : function(err){
			callback(err);
		}
	});
}

exports.createGood = function(account, product, callback)
{
	var good = new goods();
	good.set('type', product.type);
	good.set('value', product.value);
	good.set('size', product.size);
	good.set('large', product.large);
	good.set('name', product.name);
	good.set('otherValue', product.otherValue);
	good.set('otherAttri', product.otherAttri);
	good.set('account',account);
	good.save(null, {
		success : function(good){
			callback(null);
		},
		error : function(good, err){
			console.log(err);
			callback(err);
		}
	});
}

exports.removeGood = function(account, objId, callback)
{
	var query = new Avos.Query(goods);
	query.equalTo('account', account).equalTo('objectId', objId).find({
		success : function(goods){
			if(goods[0])
				goods[0].destroy({
					success : function(good){
						callback(null);
					},
					error : function(good, err){
						callback(err);
					}
				});
		},
		error : function(err){
			callback(err);
			return;
		}
	});
}

exports.getGoodsByAccount = function(account, callback)
{
	var query = new Avos.Query(goods);
	query.equalTo('account', account).descending('createdAt').find({
		success : function(goods){
			if(goods)
			{
				var result = [];
				for(var i = 0; i < goods.length; i++)
				{
					result[i] = {objId : goods[i].getObjectId(),
								time : goods[i].getCreatedAt(),
								name : goods[i].get('name')
					};
				}
				callback(null, result);
			}
			else
				callback(null, null);
		},
		error : function(err){
			callback(err);
		}
	});
}

exports.getGoodById = function(id, callback)
{
	var query = new Avos.Query(goods);
	query.equalTo('objectId', id).find({
		success : function(good){
			if(good)
				callback(null, {objId : good[0].getObjectId(),
								time : good[0].getCreatedAt(),
								value : good[0].get('value'),
								type : good[0].get('type'),
								size : good[0].get('size'),
								large : good[0].get('large'),
								otherAttri : good[0].get('otherAttri'),
								otherValue : good[0].get('otherValue'),
								name : good[0].get('name')
				});
			else
				callback(null, null);
		},
		error : function(err){
			callback(err);
		}
	});
}

