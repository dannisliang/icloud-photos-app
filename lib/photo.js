'use strict';

var util = require('util'),
    async = require('async'),
    http = require('icloud-http-client');

function PhotoLibrary(initial, session, cookies) {
    this.initial = initial;
    this.session = session;
    this.cookies = cookies;
}

PhotoLibrary.prototype.download = function(start, end, done) {
    if(start < 0 || end < start)
        return done(new Error('Invalid start index'), null);

    // Download photo
    var task = function(callback) {
        var cookie = require('cookie');

        var parsed = cookie.parse(this.cookies.join(';'));
        var validateToken = parsed['X-APPLE-WEBAUTH-VALIDATE'];

        var target = this.index;

        http.get({
                uri: util.format(
                '%s/ph/download?syncToken=%s&validateToken=%s&locale=%s&clientId=%d',
                this.session.session.webservices.photos.url,
                this.initial.syncToken, validateToken, this.initial.locale, target),
                streaming: true,
                headers: {
                    'User-Agent': http.userAgent(),
                    'Origin': http.origin(),
                    'Cookie': this.cookies.join(';')
                }
            },
            function(err, req) {
                if(!err && req) {
                    req.on('response', function(res) {
                        // Extract filename from header
                        var filenames = /filename="([\S]+)"/
                        .exec(res.headers['content-disposition']);

                        if(!filenames || filenames.length === 0) {
                            return callback(null, null);
                        }

                        var buffers = [];

                        res.on('data', function(data) {
                            buffers.push(data);
                        });

                        res.on('end', function() {
                            return callback(null, {
                                filename: filenames[1],
                                buffer: Buffer.concat(buffers)
                            });
                        });
                    });
                    req.on('error', function(error) {
                        return callback(error, null);
                    });
                }
            }
        );
    };

    var tasks = [];

    for(var index = start; index <= end; index++) {
        tasks.push(task.bind({
                index: index,
                cookies: this.cookies,
                initial: this.initial,
                session: this.session
            })
        );
    }

    async.parallelLimit(tasks, 10, done);
};

// Upload file
PhotoLibrary.prototype.upload = function(files, callback) {
    var FormData = require('form-data'),
        readChunk = require('read-chunk'),
        imageType = require('image-type'),
        streamLength = require("stream-length");

    if(!Array.isArray(files))
        return callback(new Error('Files is not an array type'), null);

    if(!this.initial.isUploadEnabled)
        return callback(new Error('Upload functionality not enabled'), null);

    var form = new FormData();

    async.waterfall([
        function(callback) {
            files.forEach(function(file) {
                var buffer = readChunk.sync(file, 0, 12),
                    mime = imageType(buffer).mime.trim();

                var isValid = (mime.indexOf('image/jpeg') > -1)
                    || (mime.indexOf('image/jpg') > -1);

                if(!isValid)
                    console.warn('%s - File ignored - Invalid type: %s', file,
                    mime);

                var stream = require('fs').createReadStream(file);

                streamLength(stream, {},
                    function(err, result) {
                        if(err) return callback(err, null);
                        else if(result) {
                            form.append('files', stream, {
                                contentType: mime,
                                knownLength: result
                            });
                        }
                    }
                );
            });
            return callback(null, true);
        },
        function(done, callback) {
            http.post({
                uri: util.format('%s/ph/upload?syncToken=%s&locale=%s',
                this.session.session.webservices.photos.url,
                this.initial.syncToken, this.initial.locale),
                streaming: true,
                headers: {
                    'User-Agent': http.userAgent(),
                    'Origin': http.origin(),
                    'Cookie': this.cookies.join(';'),
                    'Content-Type': form.getHeaders()['content-type'],
                    'Content-Length': form.getLengthSync()
                }
            }, function(err, req) {
                if(!err && req) {
                    req.on('response', function(res) {
                        var buffer = [];
                        res.on('data', function(data) {
                            buffer.push(data.toString());
                        });
                        res.on('end', function() {
                            return callback(null, buffer.join(''));
                        });
                    });
                    req.on('error', function(err) {
                        return callback(err, null);
                    });
                    form.pipe(req);
                }
            });
        }.bind(this),
        // Parse contents
        function(data, callback) {
            try {
                return callback(null, JSON.parse(data));
            } catch(e) {
                return callback(e, null);
            }
        }
    ],
    function(err, done) {
        return err ? callback(err, null) : callback(null, done);
    });
};

// Get all folders
PhotoLibrary.prototype.folders = function(callback) {
    var Folder = require('./folder');

    async.waterfall([
        // Get folders aka Albums
        function(callback) {
            http.get({
                uri: util.format('%s/ph/folders?syncToken=%s&locale=%s&',
                    this.session.session.webservices.photos.url,
                    this.initial.syncToken, this.initial.locale),
                headers: {
                    'User-Agent': http.userAgent(),
                    'Origin': http.origin(),
                    'Cookie': this.cookies.join(';')
                }
            },
            function(err, data) {
                return err ? callback(err, null) : callback(null, data);
            })
        }.bind(this),
        // Parse contents
        function(data, callback) {
            try {
                return callback(null, JSON.parse(data));
            } catch(e) {
                return callback(e, null);
            }
        },
        // Get folders
        function(json, callback) {
            //
            var folders = [];
            json.folders.forEach(function(folder) {
                if(folder.contentsType === 'asset')
                    folders.push(new Folder(folder));
            });

            return callback(null, folders);
        }
    ], function(err, folders) {
        return err ? callback(err, null) : callback(null, folders);
    });
};

PhotoLibrary.DEFAULT_LOCALE = 'en-us';

module.exports = PhotoLibrary;

/* TODO: Album covers
var form = JSON.stringify({
syncToken: initial.syncToken,
methodOverride: 'GET',
clientIds: [ 220, 48, 307, 353 ]
});

http.post({
uri: util.format('%s/ph/assets?locale=%s&',
session.session.webservices.photos.url, DEFAULT_LOCALE),
form: form,
headers: {
'User-Agent': http.userAgent(),
'Origin': http.origin(),
'Cookie': cookies.join(';'),
'Content-Type': http.mime('json'),
'Content-Length': form.length
}
}, function(err, data) {
console.log(data);
});*/
/*
// TODO: Delete photo
function(json, cookies, callback) {
var form = JSON.stringify({
syncToken: initial.syncToken,
methodOverride: 'DELETE',
assets: [ { clientId: 687 } ]
});

http.post({
uri: util.format('%s/ph/assets?locale=%s&',
session.session.webservices.photos.url, DEFAULT_LOCALE),
form: form,
headers: {
'User-Agent': http.userAgent(),
'Origin': http.origin(),
'Cookie': cookies.join(';'),
'Content-Type': http.mime('json'),
'Content-Length': form.length
}
}, function(err, data) {
console.log(data);
});
} */
