# icloud-photos-app
Manage photos on ICloud

## Install
Since this is not yet available on npm, you can install the module by following
these steps:

1. Clone this repository

        $ git clone https://github.com/alexlincoln/icloud-photos-app.git

2. Clone the `icloud-session` repository

        $ git clone https://github.com/alexlincoln/icloud-session.git

2. Clone the `icloud-http-client` repository

        $ git clone https://github.com/alexlincoln/icloud-http-client.git

3. Install the `icloud-http-client` module on both `icloud-session` and
`icloud-photos-app`

        $ npm install /path/to/icloud-http-client

4. Install the `icloud-session` module

        $ npm install /path/to/icloud-session

## Example
```javascript

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

```

## API
### .init(session, options, callback)
This function will initialize the module by using the given `session`. `options`
include a `locale` option, which specifies which locale to use - if none is
given, it defaults to `en-us`. `callback` returns the photo library if successful.

## Photo Library API
### .download(start, end, callback)
This function will attempt to download a range of photos from a given `start`
and `end` index. This will require the end user to know how many photos exist.
Since this module is quite early and immature, there will likely be a change
in future releases to make this easier. `callback` will contain an array of image
filenames and buffers. See above for an example.

### .upload(files, callback)
This function will upload various image assets from the local directory to
the remote Photo Library. Two paramaters are passed in; `files` an array of
file paths to read from, and `callback` returning success/failure results.
At the moment, no other formats other than `JPEG` are accepted by Apple. See
above for an example.

### .folders(callback)
This function returns an array of folders containing assets. While it has no
real use yet, it will be used to get contents of folders
(ex: `folders.get('videos')`). The only parameter needed is a `callback`. See
above for an example.

## TODO
- Videos
- View photo details (ex: dimensions, tags, favorites)
- Delete photo(s) functionality
- Download 'all' functionality
- Manage by albums
- Tests

## Bugs/Errors
As always feel free to submit any bugs or errors that you come across. Pull
requests are welcomed.

## License
Copyright (c) 2015 alexlincoln

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
