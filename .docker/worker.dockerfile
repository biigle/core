FROM ghcr.io/biigle/app as intermediate

# FROM php:8.0-alpine
FROM php@sha256:93c461b987e242223fb31184af91e1a870729aa172198b916be4049ea873ebe5
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

ARG OPENCV_VERSION=4.5.4
RUN apk add --no-cache lapack eigen openblas python3 ffmpeg py3-numpy \
    && apk add --no-cache --virtual .build-deps python3-dev py3-numpy-dev ffmpeg-dev \
        gcc g++ build-base curl cmake clang-dev linux-headers lapack-dev eigen-dev openblas-dev \
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
        -D BUILD_opencv_apps=OFF \
        -D BUILD_opencv_highgui=OFF \
        -D BUILD_opencv_python2=OFF \
        -D BUILD_opencv_wechat_qrcode=OFF \
        -D BUILD_PERF_TESTS=OFF \
        -D BUILD_TESTS=OFF \
        -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/usr \
        -D HIGHGUI_ENABLE_PLUGINS=OFF \
        -D INSTALL_C_EXAMPLES=OFF \
        -D INSTALL_PYTHON_EXAMPLES=OFF \
        -D OPENCV_EXTRA_MODULES_PATH=/tmp/opencv_contrib-${OPENCV_VERSION}/modules \
        -D VIDEOIO_PLUGIN_LIST=ffmpeg \
        -D WITH_GTK=OFF \
        -D WITH_QT=OFF \
        -D WITH_V4L=OFF \
        -D WITH_WIN32UI=OFF \
        .. \
    && make -j $(nproc) \
    && make install \
    && apk del --purge .build-deps \
    && rm -r /tmp/*

RUN ln -s "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
ADD ".docker/all-php.ini" "$PHP_INI_DIR/conf.d/all.ini"

RUN apk add --no-cache \
        openssl \
        postgresql \
        libxml2 \
        libzip \
    && apk add --no-cache --virtual .build-deps \
        postgresql-dev \
        libxml2-dev \
        libzip-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        exif \
        soap \
        pcntl \
    && apk del --purge .build-deps

RUN apk add --no-cache yaml \
    && apk add --no-cache --virtual .build-deps g++ make autoconf yaml-dev \
    && pecl install yaml \
    && docker-php-ext-enable yaml \
    && apk del --purge .build-deps

ARG PHPREDIS_VERSION=5.3.7
RUN curl -L -o /tmp/redis.tar.gz https://github.com/phpredis/phpredis/archive/${PHPREDIS_VERSION}.tar.gz \
    && tar -xzf /tmp/redis.tar.gz \
    && rm /tmp/redis.tar.gz \
    && mkdir -p /usr/src/php/ext \
    && mv phpredis-${PHPREDIS_VERSION} /usr/src/php/ext/redis \
    && docker-php-ext-install -j$(nproc) redis

ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}"
ARG PHP_VIPS_EXT_VERSION=1.0.12
RUN apk add --no-cache --virtual .build-deps \
        autoconf \
        build-base \
        vips-dev \
    && apk add --no-cache \
        vips \
    && cd /tmp \
    && curl -L https://github.com/libvips/php-vips-ext/raw/master/vips-${PHP_VIPS_EXT_VERSION}.tgz -o  vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && echo '' | pecl install vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && docker-php-ext-enable vips \
    && rm -r /tmp/* \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

# Other Python dependencies are added with the OpenCV build above.
RUN apk add --no-cache py3-scipy py3-scikit-learn py3-matplotlib

# Set this library path so the Python modules are linked correctly.
# See: https://github.com/python-pillow/Pillow/issues/1763#issuecomment-204252397
ENV LIBRARY_PATH=/lib:/usr/lib
# Install Python dependencies. Note that these also depend on some image processing libs
# that were installed along with vips.
RUN apk add --no-cache --virtual .build-deps \
        python3-dev \
        py3-pip \
        py3-wheel \
        build-base \
        libjpeg-turbo-dev \
        libpng-dev \
    && pip3 install --no-cache-dir \
        PyExcelerate==0.6.7 \
        Pillow==9.0.* \
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
