#!/bin/sh

# normal release
cat \
	src/adapter-normal/_intro.js \
	src/adapter-normal/_var.js \
	src/core.js \
	src/str-backup.js \
	src/str.js \
	src/root.js \
	src/url.js \
	src/adapter-normal/_outro.js \
	> \
	dist/underscore.ext.js

# cmd release
cat \
	src/adapter-cmd/_intro.js \
	src/adapter-cmd/_var.js \
	src/core.js \
	src/str-backup.js \
	src/str.js \
	src/root.js \
	src/url.js \
	src/adapter-cmd/_outro.js \
	> \
	dist/underscore.ext.cmd.js
