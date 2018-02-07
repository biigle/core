FROM biigle/app as intermediate

FROM php:7.1-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

# Use edge branch for repositories.
COPY .docker/repositories /etc/apk/repositories

RUN apk add --no-cache openssl postgresql-dev libxml2-dev \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install pdo pdo_pgsql pgsql json fileinfo exif mbstring soap zip pcntl

ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}"
# Install vips from source because the edge package does not have libgsf support.
# I've ommitted libexif on purpose because the EXIF orientation of images captured by
# an AUV is not reliable. Without libexif, vipsthumbnail ignores the EXIF orientation and
# the thumbnail orientation is correct again.
# Install libvips and the vips PHP extension in one go so the *-dev dependencies are
# reused.
ARG LIBVIPS_VERSION=8.5.7
RUN apk add --no-cache --virtual .build-deps \
        autoconf automake build-base glib-dev expat-dev \
        tiff-dev libjpeg-turbo-dev libgsf-dev libpng-dev \
    && apk add --no-cache glib tiff libjpeg-turbo libgsf libpng expat \
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
    && echo '' | pecl install vips \
    && docker-php-ext-enable vips \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

# Install Python dependencies. Note that these also depend on some image processing libs
# that were installed along with vips.
RUN apk add --no-cache --virtual .build-deps \
        build-base python-dev freetype-dev lapack-dev gfortran \
        libjpeg-turbo-dev libpng-dev \
    && apk add --no-cache freetype lapack \
    && curl -L https://bootstrap.pypa.io/get-pip.py > /tmp/get-pip.py \
    && python /tmp/get-pip.py \
    && pip install --no-cache-dir numpy==1.8.2 \
    && pip install --no-cache-dir scikit-learn==0.14.1 \
    && pip install --no-cache-dir Pillow==2.6.0 \
    && pip install --no-cache-dir scipy==0.13.3 \
    && pip install --no-cache-dir PyExcelerate==0.6.7 \
    && pip install --no-cache-dir matplotlib==1.5.3 \
    && apk del --purge .build-deps \
    && rm -rf /var/cache/apk/*

# Just copy from intermediate biigle/app so the installation of dependencies with
# Composer doesn't have to run twice.
COPY --from=intermediate /var/www /var/www

WORKDIR /var/www
