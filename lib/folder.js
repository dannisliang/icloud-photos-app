'use strict';

// Incomplete implementation

function Folder(properties) {
    this.properties = properties;

    Object.defineProperty(this, 'properties', {
        value: this.properties
    });
}

module.exports = Folder;
