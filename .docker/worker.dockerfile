FROM php:7.1-cli

RUN apt-get update

RUN apt-get install -y python python-dev python-pip libfreetype6-dev libblas-dev liblapack-dev gfortran --no-install-recommends
RUN pip install -U pip
# Run as separate commands so previous packages don't have to be build anew if one failed
RUN pip install --no-cache-dir numpy==1.8.2
RUN pip install --no-cache-dir scikit-learn==0.14.1
RUN pip install --no-cache-dir scipy==0.13.3
RUN pip install --no-cache-dir PyExcelerate==0.6.7
RUN pip install --no-cache-dir matplotlib==1.3.1
RUN apt-get remove -y --purge python-dev gfortran \
    && apt-get autoremove -y \
    && apt-get clean -y

RUN apt-get install -y libpq-dev postgresql-client-9.4 --no-install-recommends \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql

RUN apt-get install -y libxml2-dev --no-install-recommends \
    && docker-php-ext-install soap

RUN docker-php-ext-install json fileinfo exif zip mbstring pcntl

# Build libvips from source since the vips PHP extension requires vips >=8.2 which is
# not available in Debian Jessie
RUN apt-get -y install \
    # required to build vips
    automake gtk-doc-tools build-essential pkg-config glib2.0-dev libexpat1-dev \
    # required for TIFF, JPG, dzi and PNG support of vips
    libtiff5-dev libjpeg62-turbo-dev libgsf-1-dev libpng-dev \
    --no-install-recommends

RUN cd /tmp \
    && curl -L https://github.com/jcupitt/libvips/releases/download/v8.5.7/vips-8.5.7.tar.gz > vips-8.5.7.tar.gz \
    && tar -xzf vips-8.5.7.tar.gz \
    && rm vips-8.5.7.tar.gz
RUN cd /tmp/vips-8.5.7 \
    && ./configure --with-jpeg-includes=/usr/include --with-jpeg-libraries=/usr/lib \
    && make \
    && make install \
    && cd /tmp \
    && rm -r vips-8.5.7
RUN pecl install vips \
    && docker-php-ext-enable vips

RUN apt-get remove --purge -y automake gtk-doc-tools build-essential \
    && apt-get autoremove -y \
    && apt-get clean -y

CMD ["php", "artisan", "queue:work", "--sleep=5", "--tries=3", "--timeout=0"]
