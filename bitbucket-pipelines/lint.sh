#!/bin/bash
echo '======================'
echo '== Lint assets =='
echo '======================'
npm set progress=false
./lintHook.sh $PWD
if [ $? != 0 ]; then
    exit 1;
fi
