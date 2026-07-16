FROM python:3.13

COPY .docker/requirements.txt /tmp/requirements.txt

RUN pip3 install --no-cache-dir --upgrade pip \
    # Install torch first to get the CPU version. It is also present in
    # requirements.txt but this is only for automatic vulnerability checks.
    && pip3 install --ignore-installed --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.12.1 \
        torchvision==0.27.1 \
    && pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# The container runs as a UID that has no /etc/passwd entry, so torch's
# getpass.getuser() call (used to build a default cache dir) fails.
# Setting this explicitly avoids that lookup.
ENV TORCHINDUCTOR_CACHE_DIR=/tmp/torchinductor

WORKDIR /var/www

COPY . /var/www

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
