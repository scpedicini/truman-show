#!/bin/bash

# This script can be used with raycast tool on macos to search for images

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Find Images
# @raycast.mode silent
# @raycast.packageName com.specularrealms.trumanshow
# @raycast.author Shaun Pedicini
# @raycast.authorURL https://github.com/scpedicini/truman-show

# Optional parameters:
# @raycast.icon 🖼️
# @raycast.argument1 { "type": "text", "placeholder": "search terms", "percentEncoded": false, "optional": true }

~/.nvm/versions/node/v16.14.0/bin/node ~/dev/truman-show/node_modules/.bin/electron ~/dev/truman-show $1
echo "Success"
