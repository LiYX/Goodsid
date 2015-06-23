var needle = require('needle');

var key = '44dc934e-e75e-48fd-ab47-e3b3f98c3358';

var trial_key_url = 'http://sandbox.api.simsimi.com/request.p?key=' + key + '&lc=zh&ft=1.0&text=';

exports.talk = function (text, callback) {
	needle.get(trial_key_url + text, {}, function(err, res, body) {
		if (err) {
			callback(err);
		} else {
			callback(null, body.response);
		}
	});
};