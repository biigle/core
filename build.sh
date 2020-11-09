#!/usr/bin/env bash
set -e

VERSION="arm64v8-$1"

if [ -z "$VERSION" ]; then
    VERSION="arm64v8-$(git describe --tags)"
    read -p "No build version specified, using latest git tag ${VERSION}. Press enter to continue."
fi

docker-compose build --build-arg BIIGLE_VERSION=$VERSION

read -p "Publish the images to GitHub? [y/N]" -n 1 -r
# Check if the current HEAD belongs to a version.
git describe --tags --exact-match &> /dev/null
if [ $? -eq 0 ]; then
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker tag \
            docker.pkg.github.com/biigle/core/app:arm64v8 \
            docker.pkg.github.com/biigle/core/app:$VERSION
        docker tag \
            docker.pkg.github.com/biigle/core/worker:arm64v8 \
            docker.pkg.github.com/biigle/core/worker:$VERSION
        docker tag \
            docker.pkg.github.com/biigle/core/web:arm64v8 \
            docker.pkg.github.com/biigle/core/web:$VERSION

        docker push docker.pkg.github.com/biigle/core/app:$VERSION
        docker push docker.pkg.github.com/biigle/core/worker:$VERSION
        docker push docker.pkg.github.com/biigle/core/web:$VERSION

        docker rmi docker.pkg.github.com/biigle/core/app:$VERSION
        docker rmi docker.pkg.github.com/biigle/core/worker:$VERSION
        docker rmi docker.pkg.github.com/biigle/core/web:$VERSION
    fi
fi

# Update the "latest" images if the current HEAD is on master.
if [ "$(git rev-parse --abbrev-ref HEAD)" == "master" ]; then
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker push docker.pkg.github.com/biigle/core/app:arm64v8
        docker push docker.pkg.github.com/biigle/core/worker:arm64v8
        docker push docker.pkg.github.com/biigle/core/web:arm64v8
    fi
fi

docker image prune
