FROM ghcr.io/biigle/app AS intermediate

FROM pytorch/pytorch:2.9.1-cuda12.8-cudnn9-runtime
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
        wget \
    && wget -qO /tmp/cuda-keyring.deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb \
    && dpkg -i /tmp/cuda-keyring.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        cuda-nvcc-11-8 \
        libcusparse-dev-11-8 \
        libcublas-dev-11-8 \
        libcusolver-dev-11-8 \
    && export CUDA_HOME=/usr/local/cuda \
    && export TORCH_CUDA_ARCH_LIST="7.0;7.5;8.0;8.6;8.9" \
    && pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && pip3 install --no-cache-dir --no-build-isolation git+https://github.com/Gy920/segment-anything-2-real-time \
    # Use --no-dependencies so torch is not installed again.
    # Uncomment this if you have an actual GPU.
    # && pip3 install --no-dependencies --index-url https://download.pytorch.org/whl/cu118 xformers==0.0.23 \
    && apt-get purge -y \
        build-essential \
        git \
        wget \
        cuda-nvcc-11-8 \
        libcusparse-dev-11-8 \
        libcublas-dev-11-8 \
        libcusolver-dev-11-8 \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* \
    && rm -r /tmp/*

# Ensure compatibility with default paths of bigle/largo.
RUN ln -s /opt/conda/bin/python3 /usr/bin/python3
RUN ln -s /opt/conda/bin/python /usr/bin/python

WORKDIR /var/www

COPY --from=intermediate /var/www /var/www
