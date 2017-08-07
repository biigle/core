FROM php:7.0.21-cli

RUN apt-get update

RUN apt-get install -y libpq-dev postgresql-client-9.4 --no-install-recommends \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql

RUN apt-get install -y openssl libfreetype6-dev libjpeg62-turbo-dev libpng-dev --no-install-recommends \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install json fileinfo exif gd zip mbstring

RUN apt-get install -y python python-dev python-pip libblas-dev liblapack-dev gfortran --no-install-recommends
RUN pip install -U pip
# Run as separate commands so previous packages don't have to be build anew if one failed
RUN pip install --no-cache-dir numpy==1.8.2
RUN pip install --no-cache-dir scikit-learn==0.14.1
RUN pip install --no-cache-dir scipy==0.13.3
RUN pip install --no-cache-dir PyExcelerate==0.6.7
RUN pip install --no-cache-dir matplotlib==1.3.1
RUN apt-get remove -y --purge python-dev gfortran
RUN apt-get autoremove -y

RUN usermod -u 1000 www-data
RUN groupmod -g 1000 www-data

RUN apt-get install -y supervisor
ADD .docker/supervisor.conf /etc/supervisor/conf.d/default.conf

ENTRYPOINT ["supervisord", "--nodaemon", "--configuration", "/etc/supervisor/supervisord.conf"]
