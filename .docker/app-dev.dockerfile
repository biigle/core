FROM php:7.1-fpm
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apt-get update \
    && apt-get install -y openssl postgresql-client-9.4 libpq-dev libxml2-dev --no-install-recommends \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring soap \
    && apt-get clean -y
