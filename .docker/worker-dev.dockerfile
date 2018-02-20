FROM php:7.1-cli
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

# Install Postgres client
RUN apt-get update \
    && apt-get install -y libpq-dev postgresql-client-9.4 --no-install-recommends \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get remove --purge -y libpq-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instal PHP SOAP extension
RUN apt-get update \
    && apt-get install -y libxml2-dev --no-install-recommends \
    && docker-php-ext-install soap \
    && apt-get remove --purge -y libxml2-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install other required extensions
RUN apt-get update \
    && apt-get install -y zlib1g-dev zlib1g --no-install-recommends \
    && docker-php-ext-install json fileinfo exif zip mbstring pcntl \
    && apt-get remove --purge -y zlib1g-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Build libvips from source since the vips PHP extension requires vips >=8.2 which is
# not available in Debian Jessie

# These libraries are required for TIFF, JPG, dzi and PNG support of vips
RUN apt-get update \
    && apt-get -y install libtiff5 libjpeg62-turbo libgsf-1-114 libpng12-0 libexpat1 \
        --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install libvips and the vips PHP extension in one go so the *-dev dependencies are
# reused.
ARG LIBVIPS_VERSION=8.5.7
ARG PHP_VIPS_EXT_VERSION=1.0.7
RUN apt-get update \
    && apt-get -y install \
        automake gtk-doc-tools build-essential pkg-config glib2.0-dev libexpat1-dev \
        libtiff5-dev libjpeg62-turbo-dev libgsf-1-dev libpng-dev \
        --no-install-recommends \
    && cd /tmp \
    && curl -L https://github.com/jcupitt/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.gz > vips-${LIBVIPS_VERSION}.tar.gz \
    && tar -xzf vips-${LIBVIPS_VERSION}.tar.gz \
    && cd /tmp/vips-${LIBVIPS_VERSION} \
    && ./configure \
        --without-python \
        --enable-debug=no \
        --disable-dependency-tracking \
        --disable-static \
        --with-jpeg-includes=/usr/include \
        --with-jpeg-libraries=/usr/lib \
    && make \
    && make -s install-strip \
    && cd /tmp \
    && curl -L https://github.com/jcupitt/php-vips-ext/releases/download/v${PHP_VIPS_EXT_VERSION}/vips-${PHP_VIPS_EXT_VERSION}.tgz > vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && pecl install vips-${PHP_VIPS_EXT_VERSION}.tgz \
    && docker-php-ext-enable vips \
    && rm -r /tmp/* \
    && apt-get remove --purge -y automake gtk-doc-tools build-essential glib2.0-dev \
        libexpat1-dev libtiff5-dev libjpeg62-turbo-dev libgsf-1-dev libpng-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python with modules after vips because it also depends on the various image
# processing libraries (libjpeg etc.)
RUN apt-get update \
    && apt-get install -y python libfreetype6 libblas3 liblapack3 --no-install-recommends \
    && apt-get install -y python-dev libfreetype6-dev libblas-dev liblapack-dev \
        gfortran libjpeg62-turbo-dev libpng-dev \
        --no-install-recommends \
    && curl -L https://bootstrap.pypa.io/get-pip.py > /tmp/get-pip.py \
    && python /tmp/get-pip.py \
    && pip install --no-cache-dir numpy==1.8.2 \
    && pip install --no-cache-dir scikit-learn==0.14.1 \
    && pip install --no-cache-dir Pillow==2.6.0 \
    && pip install --no-cache-dir scipy==0.13.3 \
    && pip install --no-cache-dir PyExcelerate==0.6.7 \
    && pip install --no-cache-dir matplotlib==1.5.3 \
    && apt-get remove -y --purge python-dev libfreetype6-dev libblas-dev liblapack-dev \
        gfortran libjpeg62-turbo-dev libpng-dev \
    && apt-get clean \
    && rm -r /tmp/* \
    && rm -rf /var/lib/apt/lists/*

# Create a user that can be used for debugging. Some commands like artisan tinker
# require a home directory.
RUN useradd -mU --uid 1000 biigle

CMD ["php", "artisan", "queue:work", "--sleep=5", "--tries=3", "--timeout=0"]
