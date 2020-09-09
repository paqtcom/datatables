#!/bin/bash
path=$1

#
# Use the optional --continue flag to run Gulp without breaking on warnings/errors
#
continueFlag=$2

if [ -z "$path" ] || [ ! -d "$path" ]; then
    echo "usage: ./lintHook.sh pathProjectRoot"
    echo "for example: ./lintHook.sh \$PWD"
    exit
fi

echo "====== Set the proper node version ======="
if [ -f ~/.nvm/nvm.sh ]; then
    . ~/.nvm/nvm.sh
fi

nvm use 14

echo "====== Running linters ======="

echo "=== $gulpfile start ==="
cd $path/$gulpfile

if [ -f package.json ]; then
    find . -maxdepth 1 -name package.json | grep package > /dev/null 2>&1
    if [ $? == 0 ]; then
        echo "= yarn ="
        yarn install
        if [ $? != 0 ]; then
            exit 1
        fi
    fi

    if [ -f node_modules/gulp/bin/gulp.js ]; then
        echo "= gulp ="
        npm run lint
        if [ $? != 0 ]; then
            exit 1
        fi
    else
        echo "No gulp installed"
    fi
else
    echo "Package.json doesn't exist"
fi

echo "=== $gulpfile end ==="

echo "====== Set node back to the default version ======"
nvm use default

echo "================================="
