var EventProxy = require('eventproxy');
var needle = require('needle');

var config = require('../config');

var domain = 'http://127.0.0.1:5000';

// 登录获取 cookie
var login = exports.login = function (params, callback) {
	needle.get(domain + '/login?username=' + params.student_id + '&password=' + params.password, {}, function (err, res, body) {
		if (err) {
			callback(err);
		} else {
			body = JSON.parse(body);
			if (!body.result) {
				callback(new Error(body.cookie));
			} else {
				callback(null, body.cookie);
			}
		}
	});
};

// 获取 分数
var get_score = exports.get_score = function (params, cookie, callback) {
	var ep = EventProxy.create();

	// step1 判断 cookie
	if (!cookie) {
		login({
			student_id: params.student_id,
			password: params.password
		}, function (err, cookie) {
			if (err) {
				callback(err);
			} else {
				ep.emitLater('query_score', cookie);
			}
		});
	} else {
		ep.emitLater('query_score', cookie);
	}

	// step2 query score
	ep.once('query_score', function (cookie) {
		var year = params.year || config.year;
		var term = params.term || config.term;
		needle.get(domain + '/get_score?sno=' + params.student_id + '&cookie=' + cookie + '&year=' + year + '&term=' + term, {}, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				body = JSON.parse(body);
				if (body.result) {
					callback(null, body.courses);
				} else {
					callback(new Error('Get score failed.'));
				}
			}
		});
	});
};

// 获取 GPA
var get_gpa = exports.get_gpa = function (params, cookie, callback) {
	var ep = EventProxy.create();

	// step1 判断 cookie
	if (!cookie) {
		login({
			student_id: params.student_id,
			password: params.password
		}, function (err, cookie) {
			if (err) {
				callback(err);
			} else {
				ep.emitLater('query_gpa', cookie);
			}
		});
	} else {
		ep.emitLater('query_gpa', cookie);
	}

	// step2 query gpa
	ep.once('query_gpa', function (cookie) {
		var year = params.year || config.year;
		var term = params.term || config.term;
		needle.get(domain + '/get_gpa?sno=' + params.student_id + '&cookie=' + cookie + '&year=' + year + '&term=' + term, {}, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				body = JSON.parse(body);
				if (body.result) {
					callback(null, body.gpa);
				} else {
					callback(new Error('Get gpa failed.'));
				}
			}
		});
	});
};

// 获取个人信息
var get_info = exports.get_info = function (cookie, callback) {
	needle.get(domain + '/get_info?cookie=' + cookie, {}, function (err, res, body) {
		if (err) {
			callback(err);
		} else {
			body = JSON.parse(body);
			if (body.result) {
				callback(null, body.info[0]);
			} else {
				callback(new Error(body.info));
			}
		}
	});
};

// 获取课表
var get_timetable = exports.get_timetable = function (params, cookie, callback) {

	var ep = EventProxy.create();

	// step1 判断 cookie
	if (!cookie) {
		login({
			student_id: params.student_id,
			password: params.password
		}, function (err, cookie) {
			if (err) {
				callback(err);
			} else {
				ep.emitLater('get_timetable', cookie);
			}
		});
	} else {
		ep.emitLater('get_timetable', cookie);
	}

	// step2 get timetable
	ep.once('get_timetable', function (cookie) {
		var year = params.year || config.year;
		var term = params.term || config.term;
		needle.get(domain + '/timetable?cookie=' + cookie + '&year=' + params.year + '&term=' + params.term, {}, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				body = JSON.parse(body);
				if (body.result) {
					callback(null, body.courses);
				} else {
					callback(new Error('Some thing wrong!'));
				}
			}
		});
	});
};

// 学分总览
var get_overview = exports.get_overview = function (params, cookie, callback) {

	var ep = EventProxy.create();

	// step1 判断 cookie
	if (!cookie) {
		login({
			student_id: params.student_id,
			password: params.password
		}, function (err, cookie) {
			if (err) {
				callback(err);
			} else {
				ep.emitLater('get_overview', cookie);
			}
		});
	} else {
		ep.emitLater('get_overview', cookie);
	}

	// step2 get overview
	ep.once('get_overview', function (cookie) {
		var year = params.year || config.year;
		var term = params.term || config.term;
		needle.get(domain + '/overview?cookie=' + cookie + '&year=' + params.year + '&term=' + params.term, {}, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				body = JSON.parse(body);
				console.log(body);
				console.log(body.credit.required_credit);
				console.log(body.credit.earned_credit);
				if (body.result) {
					callback(null, body.credit.required_credit);
				} else {
					callback(new Error('Some thing wrong!'));
				}
			}
		});
	});
};