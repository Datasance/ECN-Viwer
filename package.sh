#!/usr/bin/env sh
#
# Package.sh is a simple script that creates a distribution tarball from the files and folders in this repo that
# we want to ship to customers. These files are defined in 'distro-list.txt'.
#

# Import our helper functions
. scripts/utils.sh

VERSION="v0.3.12"

prettyTitle "Datasance ioFog ECN Viewer Packaging"
echoInfo "Beginning packaging process"

# echoInfo "Building application bundle"
# npm run build

# This is what we want to call our distro
DISTRO_NAME="datasance-iofog-ecn-viewer_${VERSION}.tar.gz"
# Clean away any previous distro
if [ -f ${DISTRO_NAME} ]; then
    echoInfo "Removing old Distro file"
    rm ${DISTRO_NAME}
fi
npm install --force
echoInfo "Building production app"
npm run build 
cp -r build package/
cd package && npm version "${VERSION}" --allow-same-version && cd -

echoInfo "Creating ECN Viewer tarball with name '${DISTRO_NAME}''"

cp LICENSE package/LICENSE.md

# Build our archive
tar -czvf ${DISTRO_NAME} \
    --exclude='^#' \
    --exclude="./server/node_modules" \
    --exclude="./node_modules" \
    --exclude="./.github" \
    -T distro-list.txt


npm publish ${DISTRO_NAME} --access public


echoInfo "Distro packaging complete!"