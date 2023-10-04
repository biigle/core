# PHP 8.1.13
#FROM php:8.1-alpine
FROM php@sha256:f9e31f22bdd89c1334a03db5c8800a5f3b1e1fe042d470adccf58a29672c6202
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

ARG OPENCV_VERSION=4.6.0-r3
RUN apk add --no-cache \
        eigen \
        ffmpeg \
        lapack \
        openblas \
        py3-numpy \
        python3 \
        py3-opencv="$OPENCV_VERSION"

RUN ln -s "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
ADD ".docker/all-php.ini" "$PHP_INI_DIR/conf.d/all.ini"

RUN apk add --no-cache \
        libxml2 \
        libzip \
        openssl \
        postgresql \
    && apk add --no-cache --virtual .build-deps \
        libxml2-dev \
        libzip-dev \
        postgresql-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install -j$(nproc) \
        exif \
        pcntl \
        pdo \
        pdo_pgsql \
        pgsql \
        soap \
        zip \
    && apk del --purge .build-deps

# Configure proxy if there is any. See: https://stackoverflow.com/a/2266500/1796523
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy $HTTP_PROXY
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
# Install vips from source because the apk package does not have dzsave support! Install
# libvips and the vips PHP extension in one go so the *-dev dependencies are reused.
ARG LIBVIPS_VERSION=8.12.2
ARG PHP_VIPS_EXT_VERSION=1.0.13
RUN apk add --no-cache --virtual .build-deps \
        autoconf \
        automake \
        build-base \
        expat-dev \
        glib-dev \
        libgsf-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        tiff-dev \
    && apk add --no-cache \
        expat \
        glib \
        libgsf \
        libjpeg-turbo \
        libpng \
        tiff \
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

# Unset proxy configuration again.
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy ""

# Other Python dependencies are added with the OpenCV build above.
RUN apk add --no-cache py3-scipy py3-scikit-learn py3-matplotlib py3-shapely

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
        Pillow==10.0.1 \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

WORKDIR /var/www

COPY composer.lock composer.json /var/www/

ARG COMPOSER_NO_INTERACTION=1
ARG COMPOSER_ALLOW_SUPERUSER=1
ARG COMPOSER_HOME=/tmp/composer
# Install Composer based on the trusted commit:
# https://github.com/composer/getcomposer.org/commit/ce25411cc528444e8c3c60775bde77e01921a1ef
RUN curl https://raw.githubusercontent.com/composer/getcomposer.org/ce25411cc528444e8c3c60775bde77e01921a1ef/web/installer | php -- \
    && php composer.phar install --no-dev --no-scripts \
    && rm -r $COMPOSER_HOME

COPY . /var/www

# This is required so the artisan optimize command does not fail.
RUN mkdir -p /var/www/storage/framework/views

RUN php composer.phar dump-autoload -o \
    && rm composer.phar

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
