#!/bin/bash
echo '======================'
echo '== Compiling assets =='
echo '======================'
npm set progress=false
./buildHook.sh $PWD
if [ $? != 0 ]; then
    exit 1;
fi
