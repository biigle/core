FROM ghcr.io/biigle/app AS intermediate

FROM pytorch/pytorch:2.1.2-cuda11.8-cudnn8-runtime
LABEL maintainer "Martin Zurowietz <martin@cebitec.uni-bielefeld.de>"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends software-properties-common \
    && add-apt-repository -y ppa:ondrej/php \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        php8.1-cli \
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
        git \
        libvips \
    && pip3 install --no-cache-dir -r /tmp/requirements.txt \
    # Use --no-dependencies so torch is not installed again.
    # Uncomment this if you have an actual GPU.
    # && pip3 install --no-dependencies --index-url https://download.pytorch.org/whl/cu118 xformers==0.0.23 \
    && apt-get purge -y \
        build-essential \
        git \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* \
    && rm -r /tmp/*

# Ensure compatibility with default paths of bigle/largo.
RUN ln -s /opt/conda/bin/python3 /usr/bin/python3
RUN ln -s /opt/conda/bin/python /usr/bin/python

WORKDIR /var/www

COPY --from=intermediate /var/www /var/www
