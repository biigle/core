#!/usr/bin/env bash
die () {
    echo >&2 "$@"
    exit 1
}

VERSION=$1

if [ -z "$VERSION" ]; then
    VERSION=$(git describe --tags)
    read -p "No build version specified, using latest git tag ${VERSION}. Press enter to continue."
fi

docker-compose build --build-arg BIIGLE_VERSION=$VERSION
