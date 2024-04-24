# PHP 8.1.27
# FROM php:8.1
FROM php@sha256:9b5dfb7deef3e48d67b2599e4d3967bb3ece19fd5ba09cb8e7ee10f5facf36e0
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        python3 \
        python3-numpy \
        python3-opencv \
        python3-scipy \
        python3-sklearn \
        python3-matplotlib \
        python3-shapely \
        python3-pandas \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

RUN ln -s "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
    && apt-get install -y --no-install-recommends \
        libxml2 \
        libzip4 \
        postgresql-client \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/bin/pgsql \
    && docker-php-ext-install -j$(nproc) \
        exif \
        pcntl \
        pdo \
        pdo_pgsql \
        pgsql \
        soap \
        zip \
    && apt-get purge -y \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

# Configure proxy if there is any. See: https://stackoverflow.com/a/2266500/1796523
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy $HTTP_PROXY

ARG PHPREDIS_VERSION=5.3.7
RUN curl -L -o /tmp/redis.tar.gz https://github.com/phpredis/phpredis/archive/${PHPREDIS_VERSION}.tar.gz \
    && tar -xzf /tmp/redis.tar.gz \
    && rm /tmp/redis.tar.gz \
    && mkdir -p /usr/src/php/ext \
    && mv phpredis-${PHPREDIS_VERSION} /usr/src/php/ext/redis \
    && docker-php-ext-install -j$(nproc) redis

# ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        libvips-dev \
    && apt-get install -y --no-install-recommends \
        libvips42 \
    && pecl install vips \
    && docker-php-ext-enable vips \
    && apt-get purge -y \
        libvips-dev \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

# Unset proxy configuration again.
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy ""

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        python3-pip \
    && pip3 install --no-cache-dir --break-system-packages \
        PyExcelerate==0.6.7 \
        Pillow==10.2.0 \
    && pip3 install --no-cache-dir --break-system-packages --index-url https://download.pytorch.org/whl/cpu \
        torch==2.1.* \
        torchvision==0.16.* \
    && apt-get purge -y \
        python3-pip \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

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
