'use strict';

exports.init = function(session, options, callback) {
    var util = require('util'),
        async = require('async'),
        http = require('icloud-http-client');

    var PhotoLibrary = require('./lib/photo');

    if(!options) options = {};

    var locale = options.locale || PhotoLibrary.DEFAULT_LOCALE;

    async.waterfall([
        function(callback) {
            http.get({
                uri: util.format('%s/ph/startup?locale=%s',
                    session.session.webservices.photos.url, locale),
                headers: {
                    'User-Agent': http.userAgent(),
                    'Origin': http.origin(),
                    'Cookie': session.cookies[0].join(';')
                }
            }, function(err, data, cookies, headers) {
                return err ? callback(err, null, null) :
                    callback(null, data, cookies);
            });
        },
        function(data, token, callback) {
            try {
                var json = JSON.parse(data);
                var cookies = session.cookies[0].map(function(cookie) {
                    if(cookie.indexOf('X-APPLE-WEBAUTH-TOKEN') > -1)
                        return token;
                    return cookie;
                });
                return callback(null, json, cookies);
            } catch(e) {
                return callback(e, null, null);
            }
        }
    ], function(err, initial, cookies) {
        initial.locale = locale;
        return err ? callback(err, null) :
            callback(null, new PhotoLibrary(initial, session, cookies));
    });
};
