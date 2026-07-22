FROM pytorch/pytorch:2.13.0-cuda12.6-cudnn9-runtime

COPY .docker/gpu-requirements.txt /tmp/requirements.txt

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
        build-essential \
        git \
        libvips \
    && pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt \
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

COPY . /var/www

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
