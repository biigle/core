FROM php:7.1-fpm-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apk add --no-cache openssl postgresql-dev libxml2-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring soap

COPY composer.lock composer.json /var/www/

COPY database /var/www/database

WORKDIR /var/www

RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php -r "if (hash_file('SHA384', 'composer-setup.php') === '669656bab3166a7aff8a7506b8cb2d1c292f042046c5a994c43155c0be6190fa0355160742ab2e1c88d40d5be660b410') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
    && php composer-setup.php \
    && rm composer-setup.php \
    # Ignore platform reqs because the app image is stripped down to the essentials
    # and doens't meet some of the requirements. We do this for the worker, though.
    && php composer.phar install --no-dev --no-scripts --ignore-platform-reqs \
    && rm composer.phar

COPY . /var/www

# Make this writable for whatever user the app is running as.
RUN chmod o+w /var/www/bootstrap/cache

# Don't cache the config because this will ignore the environment variables of the
# production container.
RUN php /var/www/artisan route:cache
RUN php /var/www/artisan optimize
