#!/usr/bin/env bash
set -e

VERSION="arm64v8-$1"

if [ -z "$VERSION" ]; then
    VERSION="arm64v8-$(git describe --tags)"
    read -p "No build version specified, using latest git tag ${VERSION}. Press enter to continue."
fi

docker compose build --build-arg BIIGLE_VERSION=$VERSION

read -p "Publish the images to GitHub? [y/N]" -r
# Check if the current HEAD belongs to a version.
git describe --tags --exact-match &> /dev/null
if [ $? -eq 0 ]; then
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker tag \
            ghcr.io/biigle/app:arm64v8 \
            ghcr.io/biigle/app:$VERSION
        docker tag \
            ghcr.io/biigle/worker:arm64v8 \
            ghcr.io/biigle/worker:$VERSION
        docker tag \
            ghcr.io/biigle/web:arm64v8 \
            ghcr.io/biigle/web:$VERSION

        docker push ghcr.io/biigle/app:$VERSION
        docker push ghcr.io/biigle/worker:$VERSION
        docker push ghcr.io/biigle/web:$VERSION

        docker rmi ghcr.io/biigle/app:$VERSION
        docker rmi ghcr.io/biigle/worker:$VERSION
        docker rmi ghcr.io/biigle/web:$VERSION
    fi
fi

# Update the "latest" images if the current HEAD is on master.
if [ "$(git rev-parse --abbrev-ref HEAD)" == "master" ]; then
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker push ghcr.io/biigle/app:arm64v8
        docker push ghcr.io/biigle/worker:arm64v8
        docker push ghcr.io/biigle/web:arm64v8
    fi
fi

docker image prune
