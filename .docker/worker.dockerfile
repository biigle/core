FROM php:7.1-alpine

RUN apk add --no-cache openssl postgresql-dev libxml2-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring soap zip pcntl

ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}"
# Install vips from source because there is no up to date package available.
ARG LIBVIPS_VERSION=8.5.7
RUN apk add --no-cache --virtual .build-deps \
        autoconf automake build-base glib-dev expat-dev \
        libexif-dev tiff-dev libjpeg-turbo-dev libgsf-dev libpng-dev \
    && apk add --no-cache glib libexif tiff libjpeg-turbo libgsf libpng expat \
    && cd /tmp \
    && curl -L https://github.com/jcupitt/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.gz > vips-${LIBVIPS_VERSION}.tar.gz \
    && tar -xzf vips-${LIBVIPS_VERSION}.tar.gz \
    && rm vips-${LIBVIPS_VERSION}.tar.gz \
    && cd vips-${LIBVIPS_VERSION} \
    && ./configure \
        --without-python \
        --enable-debug=no \
        --disable-dependency-tracking \
        --disable-static \
    && make \
    && make -s install-strip \
    && cd /tmp \
    && rm -r vips-${LIBVIPS_VERSION} \
    # Do this here because all the *-dev stuff is still needed to build php-vips-ext
    && echo '' | pecl install vips \
    && docker-php-ext-enable vips \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

# I STOPPED HERE BECAUSE INSTALLING THE PYTHON DEPS WAS TOO CUMBERSOME. EVERYTHING ABOVE
# WORKS, THOUGH.

# Install Python dependencies
# RUN apk --no-cache --virtual .build-deps python-dev freetype-dev.....

# COPY composer.lock composer.json /var/www/

# COPY database /var/www/database

# WORKDIR /var/www

# RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
#     && php -r "if (hash_file('SHA384', 'composer-setup.php') === '669656bab3166a7aff8a7506b8cb2d1c292f042046c5a994c43155c0be6190fa0355160742ab2e1c88d40d5be660b410') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
#     && php composer-setup.php \
#     && rm composer-setup.php \
#     # Ignore platform reqs because the app image is stripped down to the essentials
#     # and doens't meet some of the requirements. We do this for the worker, though.
#     && php composer.phar install --no-dev --no-scripts --ignore-platform-reqs \
#     && rm composer.phar

# COPY . /var/www

# RUN chown -R www-data:www-data \
#         /var/www/storage \
#         /var/www/bootstrap/cache

# RUN php /var/www/artisan route:cache
# RUN php /var/www/artisan config:cache
# RUN php /var/www/artisan optimize

