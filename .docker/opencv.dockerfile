FROM alpine@sha256:9a839e63dad54c3a6d1834e29692c8492d93f90c59c978c1ed79109ea4fb9a54
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

ARG OPENCV_VERSION=3.4.5
RUN apk add --no-cache --virtual .build-deps python3-dev py3-pip ffmpeg-dev \
        gcc g++ build-base curl cmake clang-dev linux-headers \
    && pip3 install --no-cache-dir numpy==1.18.4 \
    && cd /tmp \
    && curl -L https://github.com/opencv/opencv/archive/${OPENCV_VERSION}.tar.gz -o ${OPENCV_VERSION}.tar.gz \
    && tar -xzf ${OPENCV_VERSION}.tar.gz \
    && curl -L https://github.com/opencv/opencv_contrib/archive/${OPENCV_VERSION}.tar.gz -o ${OPENCV_VERSION}.tar.gz \
    && tar -xzf ${OPENCV_VERSION}.tar.gz \
    && mkdir /tmp/opencv-${OPENCV_VERSION}/build \
    && cd /tmp/opencv-${OPENCV_VERSION}/build \
    && cmake \
        -D CMAKE_BUILD_TYPE=RELEASE \
        -D BUILD_TESTS=OFF \
        -D BUILD_PERF_TESTS=OFF \
        -D BUILD_EXAMPLES=OFF \
        -D BUILD_DOCS=OFF \
        -D INSTALL_PYTHON_EXAMPLES=OFF \
        -D INSTALL_C_EXAMPLES=OFF \
        -D WITH_WIN32UI=OFF \
        -D WITH_QT=OFF \
        -D OPENCV_EXTRA_MODULES_PATH=/tmp/opencv_contrib-${OPENCV_VERSION}/modules \
        .. \
    && make -j $(nproc) \
    && make install \
    && pip3 uninstall -y numpy \
    && apk del --purge .build-deps \
    && cd /usr/local \
    && tar -czf /opencv.tar.gz . \
    && rm -r /tmp/*
