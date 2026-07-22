FROM ghcr.io/biigle/app AS intermediate

FROM pytorch/pytorch:2.13.0-cuda12.6-cudnn9-runtime
LABEL org.opencontainers.image.authors="Martin Zurowietz <m.zurowietz@uni-bielefeld.de>"
LABEL org.opencontainers.image.source="https://github.com/biigle/core"

RUN LC_ALL=C.UTF-8 apt-get update \
    && apt-get install -y --no-install-recommends software-properties-common gnupg-agent \
    && add-apt-repository -y ppa:ondrej/php \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        php8.2-cli \
        php8.2-curl \
        php8.2-xml \
        php8.2-pgsql \
        php8.2-mbstring \
        php8.2-redis \
    && apt-get purge -y software-properties-common \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*

COPY gpu-requirements.txt /tmp/requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
        build-essential \
        git \
        libvips \
    && pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt \
    # Use --no-dependencies so torch is not installed again.
    # Uncomment this if you have an actual GPU.
    # && pip3 install --no-dependencies xformers>=0.0.34 \
    && apt-get purge -y \
        build-essential \
        git \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* \
    && rm -r /tmp/*

# The container runs as a UID that has no /etc/passwd entry, so torch's
# getpass.getuser() call (used to build a default cache dir) fails.
# Setting this explicitly avoids that lookup.
ENV TORCHINDUCTOR_CACHE_DIR=/tmp/torchinductor

WORKDIR /var/www

COPY --from=intermediate /var/www /var/www
