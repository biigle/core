FROM ghcr.io/biigle/app AS intermediate

FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime
LABEL maintainer "Martin Zurowietz <martin@cebitec.uni-bielefeld.de>"

# Find versions here: https://launchpad.net/~ondrej/+archive/ubuntu/php
ARG PHP_VERSION=8.1.14-2+ubuntu18.04.1+deb.sury.org+1
RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends software-properties-common \
    && add-apt-repository -y ppa:ondrej/php \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        php8.1-cli=$PHP_VERSION \
        php8.1-curl \
        php8.1-xml \
        php8.1-pgsql \
        php8.1-mbstring \
        php8.1-redis \
    && apt-get purge -y software-properties-common \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
        build-essential \
        libvips \
    && pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && apt-get purge -y \
        build-essential \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* \
    && rm -r /tmp/*

WORKDIR /var/www

COPY --from=intermediate /var/www /var/www
