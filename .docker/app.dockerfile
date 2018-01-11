FROM php:7.1-fpm-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apk add --no-cache openssl postgresql-dev libxml2-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring soap

COPY composer.lock composer.json /var/www/

COPY database /var/www/database

WORKDIR /var/www

ARG GITHUB_OAUTH_TOKEN
ENV COMPOSER_NO_INTERACTION 1
ENV COMPOSER_ALLOW_SUPERUSER 1

# Ignore platform reqs because the app image is stripped down to the essentials
# and doens't meet some of the requirements. We do this for the worker, though.
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && COMPOSER_SIGNATURE=$(curl -s https://composer.github.io/installer.sig) \
    && php -r "if (hash_file('SHA384', 'composer-setup.php') === '$COMPOSER_SIGNATURE') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
    && php composer-setup.php \
    && rm composer-setup.php \
    && php composer.phar config github-oauth.github.com ${GITHUB_OAUTH_TOKEN} \
    && php composer.phar install --no-dev --no-scripts --ignore-platform-reqs \
    && rm composer.phar

COPY . /var/www

# Make this writable for whatever user the app is running as.
RUN chmod o+w /var/www/bootstrap/cache

# Don't cache the config because this will ignore the environment variables of the
# production container.
RUN php /var/www/artisan route:cache
RUN php /var/www/artisan optimize
