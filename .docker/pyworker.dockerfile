FROM python:3.13

COPY .docker/requirements.txt /tmp/requirements.txt

RUN pip3 install --no-cache-dir --upgrade pip \
    # Install torch first to get the CPU nversion. It is also present in
    # requirements.txt but this is only for automatic vulnerability checks.
    && pip3 install --ignore-installed --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.9.* \
        torchvision==0.24.* \
    && pip3 install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

WORKDIR /var/www

COPY . /var/www

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
