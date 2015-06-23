var EventProxy = require('eventproxy');
var needle = require('needle');
var xml2js = require('xml2js');
var sha1 = require('sha1');
var url = require('url');
var _ = require('underscore');
var request = require('request');

var config = require('../config');

var avos = require('./avos');
var simsimi = require('./simsimi');
//var jwxt = require('./jwxt');

var router = require('express').Router();

// ----------------------------------
// WeChat Validate
// ----------------------------------

router.get('/wechat', function (req, res, next) {
	if (req.query.signature) {
		var echostr = req.query.echostr;
		if (checkSignature(req)) {
			req.echostr = echostr;
			res.send(echostr);
		}
	}
});

var checkSignature = function (req) {
	var gURL = url.parse(req.url, true);
	var signature = gURL.query.signature;
	var timestamp = gURL.query.timestamp;
	var nonce = gURL.query.nonce;
	var echostr = gURL.query.echostr;
 
	var array = [config.token, timestamp, nonce];
	array.sort();
 
	var str = sha1(array.join(''));
 
	if(str == signature) {
		return true;
	} else {
		return false;
	}
};

// --------------------
// WeChat Event Handler
// --------------------

// 接收消息 & 查询用户
router.post('/wechat', function (req, res, next) {
	var ep = EventProxy.create();
	// step1 获取 POST data
	var postStr = '';
	req.on('data', function (postDataChunk) {
		postStr += postDataChunk;
	});
	req.on('end', function () {
		ep.emitLater('xml_parse');
	});

	// step2 解析 xml
	ep.once('xml_parse', function () {
		xml2js.parseString(postStr, function (err, json) {
			if (err) {
				res.send(req.echostr);
			} else {
				ep.emitLater('step3', json);
			}
		})
	});

	ep.once('step3',function(json){
		req.body.json = json;
		next();
	});
/*
	// step3 查询用户
	ep.once('step3', function (json) {
		req.wechat_id = json.xml.FromUserName[0];
		req.body.json = json;

		avos.getStudentByWechatId(req.wechat_id, function (err, student) {
			if (student) {
				req.student = student;
			}
			next();
		});
	});*/
});

// 普通消息
router.post('/wechat', function (req, res, next) {
	var json = req.body.json;
	var messageType = json.xml.MsgType[0].toLowerCase();
	if (messageType == ('text' || 'image' || 'voice' || 'video' || 'location' || 'link')) {
		simsimi.talk(json.xml.Content[0], function (err, text) {
			if (err) { text = '你好！'; }
			var bindMsg = "<xml><ToUserName><![CDATA[" + json.xml.FromUserName[0] + "]]></ToUserName>"
						+ "<FromUserName><![CDATA[" + json.xml.ToUserName[0] + "]]></FromUserName>"
						+ "<CreateTime>" + new Date() + "</CreateTime>"
						+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[" + text + "]]></Content></xml>";
			res.send(bindMsg);
		});
	} else {
		next();
	}
});

// 事件推送
router.post('/wechat', function (req, res, next) {
	var json = req.body.json;
	var messageType = json.xml.MsgType[0].toLowerCase();

	if (messageType == 'event' && json.xml.Event[0].toLowerCase() == 'subscribe') {
		res.send(req.echostr);
	} else if (messageType == 'event' && json.xml.Event[0].toLowerCase() == 'click') {
		var key = json.xml.EventKey[0].toLowerCase();
		var preMsg = "<xml><ToUserName><![CDATA[" + req.body.json.xml.FromUserName[0] + "]]></ToUserName>"
			+ "<FromUserName><![CDATA[" + req.body.json.xml.ToUserName[0] + "]]></FromUserName>"
			+ "<CreateTime>" + new Date() + "</CreateTime>"
			+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[" + config.domain;
		var aftMsg = "]]></Content></xml>";
		if(key == 'collection')
		{
			res.send(preMsg + "/myCollection?wechat_id=" + json.xml.FromUserName[0] + aftMsg);
		}
		else if(key == 'comment')
		{
			res.send(preMsg + "/myComment?wechat_id=" + json.xml.FromUserName[0] + aftMsg);
		}
		else
		{
			res.send(req.echostr);
		}
		/*
		if (!req.student) {

			var bindMsg = "<xml><ToUserName><![CDATA[" + req.body.json.xml.FromUserName[0] + "]]></ToUserName>"
						+ "<FromUserName><![CDATA[" + req.body.json.xml.ToUserName[0] + "]]></FromUserName>"
						+ "<CreateTime>" + new Date() + "</CreateTime>"
						+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[<a href='" + res.locals.prefix_url + "/oauth2/login" + res.locals.suffix_url + "'>点我绑定教务系统帐号</a>]]></Content></xml>";
			res.send(bindMsg);

		} else if (key == "score") {

			jwxt.get_score({
				student_id: req.student.get('student_id'),
				password: req.student.get('password'),
				year: config.year,
				term: config.term
			}, null, function (err, scores) {
				if (err) {
					res.send(errMsg);
				} else {
					var remark = '';
					_.each(scores, function (element) {
						remark += element.kcmc + ' - ' + element.zzcj + '分 - ' + element.jxbpm + '名\n';
					});
					remark += "\n<a href='" + res.locals.prefix_url + '/oauth2/score' + res.locals.suffix_url + "'>点击查看更多成绩</a>";
					var msg = "<xml><ToUserName><![CDATA[" + req.body.json.xml.FromUserName[0] + "]]></ToUserName>"
								+ "<FromUserName><![CDATA[" + req.body.json.xml.ToUserName[0] + "]]></FromUserName>"
								+ "<CreateTime>" + new Date() + "</CreateTime>"
								+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[" + remark + "]]></Content></xml>";
					res.send(msg);
				}
			});

		} else if ((key == "today_course") || (key == "tomorrow_course")) {

			jwxt.get_timetable({
				student_id: req.student.get('student_id'),
				password: req.student.get('password'),
				year: config.year,
				term: config.term
			}, null, function (err, courses) {
				if (err) {
					res.send(errMsg);
				} else {
					var courses_msg = '';
					if (key == "today_course") {
						var day = config.days[new Date().getDay() - 1];
					} else if (key == "tomorrow_course") {
						var day = config.days[(new Date().getDay()) % 7];
					}
					if (courses[day].length > 0) {
						if (key == "today_course") {
							courses_msg = '今天有课，不嗨森\n\n';
						} else if (key == "tomorrow_course") {
							courses_msg = '明天有课，不嗨森\n\n';
						}
						_.each(courses[day], function (element) {
							courses_msg += (element + '\n');
						});
					} else {
						if (key == "today_course") {
							courses_msg = '今天没有课，嗨森';
						} else if (key == "tomorrow_course") {
							courses_msg = '明天没有课，嗨森';
						}
					}
					var msg = "<xml><ToUserName><![CDATA[" + req.body.json.xml.FromUserName[0] + "]]></ToUserName>"
								+ "<FromUserName><![CDATA[" + req.body.json.xml.ToUserName[0] + "]]></FromUserName>"
								+ "<CreateTime>" + new Date() + "</CreateTime>"
								+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[" + courses_msg + "]]></Content></xml>";
					res.send(msg);
				}
			});

		} else if (key == "profile") {
			res.send(req.echostr);
		}
*/
	} else if (messageType == 'event' && json.xml.Event[0].toLowerCase() == 'templatesendjobfinish') {
		res.send(req.echostr);
	} else if(messageType == 'event' && json.xml.Event[0].toLowerCase() == 'scancode_waitmsg'){
		var key = json.xml.EventKey[0].toLowerCase();
		if(key == 'scan')
		{
			var msg = "<xml><ToUserName><![CDATA[" + req.body.json.xml.FromUserName[0] + "]]></ToUserName>"
								+ "<FromUserName><![CDATA[" + req.body.json.xml.ToUserName[0] + "]]></FromUserName>"
								+ "<CreateTime>" + new Date() + "</CreateTime>"
								+ "<MsgType><![CDATA[text]]></MsgType><Content><![CDATA[http://test.qrcodex.co/index?paper_id=" + json.xml.ScanCodeInfo[0].ScanResult[0] + "&wechat_id=" + req.body.json.xml.FromUserName[0] +"]]></Content></xml>";
			res.send(msg);
		}
		else
		{
			res.send(req.echostr);
		}

	} else {
		res.send(req.echostr);
	}
});

exports.router = router;

// ----------------------------------
// WeChat Util
// ----------------------------------

// 获取 access token
var getAccessToken = exports.getAccessToken = function (callback) {
	console.log('get_access_token');
	var access_token_url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.AppID + '&secret=' + config.AppSecret;
	needle.get(access_token_url, {}, function(err, res, body) {
		if (err) {
			callback(err);
		} else {
			global.access_token = body.access_token;
			setTimeout(function () {
				global.access_token = '';
			}, config.wechat_time_out);
			callback(null);
		}
	})
};

// 发送普通消息
var sendMsg = exports.sendMsg = function (openId, text, callback) {
	var send_msg_url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=';
	var msg = {
		"touser": openId,
		"msgtype": "text",
		"text":
		{
			"content": text
		}
	};
	var msgString = JSON.stringify(msg);
	if (global.access_token) {
		needle.post(send_msg_url + global.access_token, msgString, {}, function (err, resp, body) {
			if (err) {
				callback(err);
			} else {
				callback(null);
			}
		});
	} else {
		getAccessToken(function (err) {
			if (err) {
				callback(err);
			} else {
				needle.post(send_msg_url + global.access_token, msgString, {}, function (err, resp, body) {
					if (err) {
						callback(err);
					} else {
						callback(null);
					}
				})
			}
		})
	}
};

// 发送模板消息
var sendTemplate = exports.sendTemplate = function (data, callback) {
	var send_template_url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=";

	var json = {
		"touser": data.wechat_id,
		"template_id": config.get_score_template_id,
		"url": data.url,
		"data":{
			"first": {
				"value": data.first,
				"color": "#666666"
			},
			"keyword1":{
				"value": data.keyword1,
				"color": "#303F9F"
			},
			"keyword2": {
				"value": data.keyword2,
				"color": "#303F9F"
			},
			"remark":{
				"value": data.remark,
				"color": "#666666"
			}
		}
	};

	var jsonString = JSON.stringify(json);
	var ep = EventProxy.create();

	// step1 获取 access token
	if (global.access_token) {
		ep.emitLater('send_template');
	} else {
		getAccessToken(function (err) {
			if (err) {
				callback(err);
			} else {
				ep.emitLater('send_template');
			}
		});
	}

	// step2 发送模板
	ep.once('send_template', function () {
		needle.post(send_template_url + global.access_token, jsonString, {}, function (err, resp, body) {
			if (err) {
				callback(err);
			} else if (body.errcode != 0) {
				console.log(body);
				callback(new Error(body.errmsg));
			} else {
				callback(null, body.msgid);
			}
		});
	});
}

// 网页授权获取微信用户信息
var getWeChatInfo = exports.getWeChatInfo = function (code, callback) {
	if (code) {
		var access_openid_url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + config.AppID + '&secret=' + config.AppSecret + '&code=' + code + '&grant_type=authorization_code';
		needle.get(access_openid_url, {}, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				body = JSON.parse(body);
				if (body.scope == 'snsapi_base') {
					callback(null, body.openid);
				} else if (body.scope == 'snsapi_userinfo') {
					var http = require('http');
					http.get({
						host: 'api.weixin.qq.com',
						path: '/sns/userinfo?access_token=' + body.access_token + '&openid=' + body.openid + '&lang=en'
					}, function (response) {
						var body2 = '';
						response.setEncoding('utf8');
				        response.on('data', function(d) {
				            body2 += d;
				        });
				        response.on('end', function() {
				            var parsed = JSON.parse(body2);
				            callback(null,  null, parsed);
				        });
					})
				}
			}
		})
	} else {
		callback(new Error('Invalid Code'));
	}
}