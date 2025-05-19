# PHP 8.2.28
# FROM php:8.2
FROM php@sha256:ed4385b854a7ef4aeee1108c75333443d64c937faaf7c7d28bf63a436df06428
LABEL org.opencontainers.image.authors="Martin Zurowietz <m.zurowietz@uni-bielefeld.de>"
LABEL org.opencontainers.image.source="https://github.com/biigle/core"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        python3 \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

RUN ln -s "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
# Enable FFI for jcupitt/vips.
# See: https://github.com/libvips/php-vips?tab=readme-ov-file#install
RUN echo "ffi.enable = true" > "$PHP_INI_DIR/conf.d/vips.ini"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
        libffi-dev \
    && apt-get install -y --no-install-recommends \
        libxml2 \
        libzip4 \
        postgresql-client \
        libffi8 \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/bin/pgsql \
    && docker-php-ext-install -j$(nproc) \
        exif \
        pcntl \
        pdo \
        pdo_pgsql \
        pgsql \
        soap \
        zip \
        ffi \
    && apt-get purge -y \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
        libffi-dev \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

# Configure proxy if there is any. See: https://stackoverflow.com/a/2266500/1796523
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy $HTTP_PROXY

ARG PHPREDIS_VERSION=6.2.0
RUN curl -L -o /tmp/redis.tar.gz https://github.com/phpredis/phpredis/archive/${PHPREDIS_VERSION}.tar.gz \
    && tar -xzf /tmp/redis.tar.gz \
    && rm /tmp/redis.tar.gz \
    && mkdir -p /usr/src/php/ext \
    && mv phpredis-${PHPREDIS_VERSION} /usr/src/php/ext/redis \
    && docker-php-ext-install -j$(nproc) redis

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends libvips42 \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

# Unset proxy configuration again.
RUN [ -z "$HTTP_PROXY" ] || pear config-set http_proxy ""

COPY .docker/requirements.txt /tmp/requirements.txt

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends \
        python3-pip \
    && pip3 install --no-cache-dir --break-system-packages --upgrade pip \
    # Install torch first to get the CPU nversion. It is also present in
    # requirements.txt but this is only for automatic vulnerability checks.
    && pip3 install --ignore-installed --no-cache-dir --break-system-packages --index-url https://download.pytorch.org/whl/cpu \
        torch==2.6.* \
        torchvision==0.21.* \
    && pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt \
    && apt-get purge -y \
        python3-pip \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* /tmp/requirements.txt

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
