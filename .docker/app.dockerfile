FROM php:7.0.21-fpm

RUN apt-get update \
    && apt-get install -y openssl postgresql-client-9.4 libpq-dev --no-install-recommends \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring

RUN usermod -u 1000 www-data
RUN groupmod -g 1000 www-data
