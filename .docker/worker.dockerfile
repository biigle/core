FROM ghcr.io/biigle/app as intermediate

# FROM php:7.4.16-cli-alpine
FROM php@sha256:85069c18ba0023aba8334b94fc3e4c9721676aa32bea223b6aba76a7446b939b
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

ARG OPENCV_VERSION=3.4.5
RUN apk add --no-cache --virtual .build-deps python3-dev py3-numpy-dev ffmpeg-dev \
        gcc g++ build-base curl cmake clang-dev linux-headers \
    && cd /tmp \
    && curl -L https://github.com/opencv/opencv/archive/${OPENCV_VERSION}.tar.gz -o ${OPENCV_VERSION}.tar.gz \
    && tar -xzf ${OPENCV_VERSION}.tar.gz \
    && curl -L https://github.com/opencv/opencv_contrib/archive/${OPENCV_VERSION}.tar.gz -o ${OPENCV_VERSION}.tar.gz \
    && tar -xzf ${OPENCV_VERSION}.tar.gz \
    && mkdir /tmp/opencv-${OPENCV_VERSION}/build \
    && cd /tmp/opencv-${OPENCV_VERSION}/build \
    && cmake \
        -D BUILD_DOCS=OFF \
        -D BUILD_EXAMPLES=OFF \
        -D BUILD_JAVA=OFF \
        -D BUILD_opencv_python2=OFF \
        -D BUILD_PERF_TESTS=OFF \
        -D BUILD_TESTS=OFF \
        -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/usr \
        -D INSTALL_C_EXAMPLES=OFF \
        -D INSTALL_PYTHON_EXAMPLES=OFF \
        -D OPENCV_EXTRA_MODULES_PATH=/tmp/opencv_contrib-${OPENCV_VERSION}/modules \
        -D WITH_GTK=OFF \
        -D WITH_QT=OFF \
        -D WITH_WIN32UI=OFF \
        .. \
    && make -j $(nproc) \
    && make install \
    && apk del --purge .build-deps \
    && rm -r /tmp/*

RUN apk add --no-cache \
        openssl \
        postgresql-dev \
        libxml2-dev \
        libzip-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        json \
        zip \
        fileinfo \
        exif \
        soap \
        pcntl

ARG PHPREDIS_VERSION=5.0.0
RUN curl -L -o /tmp/redis.tar.gz https://github.com/phpredis/phpredis/archive/${PHPREDIS_VERSION}.tar.gz \
    && tar -xzf /tmp/redis.tar.gz \
    && rm /tmp/redis.tar.gz \
    && mkdir -p /usr/src/php/ext \
    && mv phpredis-${PHPREDIS_VERSION} /usr/src/php/ext/redis \
    && docker-php-ext-install redis

ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}"
# Install vips from source because the apk package does not work with the vips PHP
# extension. Install libvips and the vips PHP extension in one go so the *-dev
# dependencies are reused.
ARG LIBVIPS_VERSION=8.8.4
ARG PHP_VIPS_EXT_VERSION=1.0.11
RUN apk add --no-cache --virtual .build-deps \
        autoconf \
        automake \
        build-base \
        glib-dev \
        tiff-dev \
        libjpeg-turbo-dev \
        libgsf-dev \
        libpng-dev \
        expat-dev \
    && apk add --no-cache \
        glib \
        tiff \
        libjpeg-turbo \
        libgsf \
        libpng \
        expat \
    && cd /tmp \
    && curl -L https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.gz -o vips-${LIBVIPS_VERSION}.tar.gz \
    && tar -xzf vips-${LIBVIPS_VERSION}.tar.gz \
    && cd vips-${LIBVIPS_VERSION} \
    && ./configure \
        --without-python \
        --enable-debug=no \
        --disable-dependency-tracking \
        --disable-static \
    && make -j $(nproc) \
    && make -s install-strip \
    && cd /tmp \
    && curl -L https://github.com/libvips/php-vips-ext/raw/master/vips-${PHP_VIPS_EXT_VERSION}.tgz -o  vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && echo '' | pecl install vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && docker-php-ext-enable vips \
    && rm -r /tmp/* \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-numpy \
    py3-scipy

RUN apk add --no-cache --repository http://dl-3.alpinelinux.org/alpine/v3.13/community/ --allow-untrusted \
    py3-scikit-learn \
    py3-matplotlib

# Set this library path so the Python modules are linked correctly.
# See: https://github.com/python-pillow/Pillow/issues/1763#issuecomment-204252397
ENV LIBRARY_PATH=/lib:/usr/lib
# Install Python dependencies. Note that these also depend on some image processing libs
# that were installed along with vips.
RUN apk add --no-cache --virtual .build-deps \
        python3-dev \
        py3-pip \
        py3-wheel \
        py3-numpy-dev \
        build-base \
        libjpeg-turbo-dev \
        libpng-dev \
    && pip3 install --no-cache-dir \
        PyExcelerate==0.6.7 \
        Pillow==8.2.* \
        imagehash \
        threadpoolctl \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

# Just copy from intermediate biigle/app so the installation of dependencies with
# Composer doesn't have to run twice.
COPY --from=intermediate /var/www /var/www

WORKDIR /var/www

# This is required to run php artisan tinker in the worker container. Do this for
# debugging purposes.
RUN mkdir -p /.config/psysh && chmod o+w /.config/psysh

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
