'use strict';

var icloud = require('icloud-session'),
    photos = require('./index');

var credentials = {
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
}

// Login
icloud.login(credentials.username, credentials.password, {},
    function(err, session) {
        if(!err && session) {
            // Initialize the module
            // See below for sample output
            photos.init(session, {}, function(err, pl) {
                // Catch any errors on initialization
                if(err) return console.error(err);

                // Get available folders (for future use)
                pl.folders(function(err, folders) {
                    if(!err && folders) {
                        console.log(folders);
                    }
                });

                // Download a range of photos
                pl.download(0, 15, function(err, files) {
                    if(!err && files) {
                        console.log(files); // { filename: 'IMG_0930.JPG', buffer: <Buffer..}
                    } else {
                        console.error(err);
                    }
                });

                // Upload various photos (currently JPEG format supported only)
                var files = ['test.jpg', 'new.jpg', 'iphone.png'];

                pl.upload(files, function(err, result) {
                    if(!err && result) {
                        console.log(result); // { status: 'OK', files: [ file...]}
                    } else {
                        console.error(err);
                    }
                });
            });
        } else {
            console.error(err);
        }
    }
);
