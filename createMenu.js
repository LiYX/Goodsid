var needle = require('needle');
var config = require('./config');

var preUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + config.AppID + "&redirect_uri=http://" + config.domain;
var aftUrl = "&response_type=code&scope=snsapi_base&state=123#wechat_redirect";

var menu = {
	"button": [
		{
			"name": "试题大全",
			"sub_button": [
				{
					"name": "热门试题",
					"type": "click",
					"key": "hot",
					"sub_button": []
				},
				{
					"name": "扫一扫",
					"type": "scancode_waitmsg",
					"key": "scan",
					"sub_button": []
				}
			]
		},
		{
			"name": "我的试题",
			"sub_button": [
				{
					"name":"...",
					"type":"view",
					"url": preUrl + "/getComment" + aftUrl
				},
				{
					"name": "我的收藏",
					"type": "click",
					//"url": preUrl + "/getCollection" + aftUrl,
					"key":"collection"
				},
				{
					"type": "click",
					"name": "我的点评",
					//"url": preUrl + "/getComment" + aftUrl
					"key":"comment"
				}
			]
		},
		{
			"name": "联系我们",
			"type": "view",
			"url": "http://www.baidu.com"
		}
	]
};

var menuString = JSON.stringify(menu);

var access_token_url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.AppID + '&secret=' + config.AppSecret;
var create_menu_url = 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=';

needle.get(access_token_url, {}, function(err, res, body) {
	if (err) {
		console.error(err);
	} else {
		needle.post(create_menu_url + body.access_token, menuString, {}, function(err, resp, body) {
			if (err) {
				console.error(err);
			} else {
				console.log(body);
			}
		})
	}
});