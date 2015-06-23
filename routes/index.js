var EventProxy = require('eventproxy');
//var _ = require('underscore');

var qiniu = require('qiniu');

var express = require('express');
var router = express.Router();

var avos = require('./avos');
//var jwxt = require('./jwxt');
var config = require('../config');

//init qiniu
qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY;
var uptoken = new qiniu.rs.PutPolicy(config.Bucket_Name);

router.get('/uptoken', function(req, res, next) {
    var token = uptoken.token();
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (token) {
        res.json({
            uptoken: token
        });
    }
});

router.get('/login',function(req, res, next){
	res.render('login');
});

router.get('/checkLogin', function(req, res, next){
	avos.getUserByAccount(req.query.account, req.query.password, function(err, user){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		if(user)
		{
			req.session.account = req.query.account;
			res.json({result : 'true'});
		}
		else
			res.json({result : 'false', msg : 'password is incorrect or the user does not exit!' });

	});
});

router.get('/getGoods', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.getGoodsByAccount(req.session.account, function(err, goods){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		if(goods)
			res.json({result : 'true', goods : goods});
		else
			res.json({result : 'true', goods : null});
	});
});

router.get('/getBackground', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.getBackground(req.session.account, function(err, background){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		else if(background)
			res.json({result : 'true', background : background});
		else
			res.json({result : 'true', background : null});
	})
});

router.get('/setBackground', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined") 
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.setBackground(req.session.account, req.query.background, function(err, result){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		if(result == 'false')
			res.json({result : 'false', msg : 'user does not exit!'});
		else
			res.json({result : 'true'});
	});
});

router.get('/setting', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.render('login');
		return;
	}
	res.render('setting', {account : req.session.account});
});

router.get('/product', function(req, res, next){
	res.render('product', {productId : req.query.productId});
});

router.post('/editGood', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.saveGood(req.session.account, req.body.product, function(err, result){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		if(result == 'false')
			res.json({result : 'false', msg : 'no previledge!'});
		else
			res.json({result : 'true'});
		return;
	});
});

router.post('/createGood', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.createGood(req.session.account, req.body.product, function(err){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		else
			res.json({result : 'true'});
	});
});

router.post('/removeGood', function(req, res, next){
	if(req.session.account == null || req.session.account == '' || typeof(req.session.account) == "undefined")
	{
		res.json({result : 'false', msg : 'login'});
		return;
	}
	avos.removeGood(req.session.account, req.body.objId, function(err){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		else
			res.json({result : 'true'});
	});
});

router.get('/getGood', function(req, res, next){
	avos.getGoodById(req.query.productId, function(err, product){
		if(err)
			res.json({result : 'false', msg : 'network fault!'});
		if(product)
			res.json({result : 'true', product : product});
		else
			res.json({result : 'true', product : null});
	});
});

router.get('/create', function(req, res, next){
	res.render('create');
});

router.get('/user', function(req, res, next){
	res.render('user');
});

router.get('/', function(req, res, next){
	res.render('login');
});

module.exports = router;