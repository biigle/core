# FROM postgres:14-alpine
FROM postgres@sha256:3eab206b57cf9acb206359d14eb2d00cdd2c396ddd7cb246690788b22ed858c4

RUN apk add --no-cache --virtual .build-deps \
        git \
        build-base \
        clang \
        llvm13-dev \
    && git clone --branch v0.5.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make OPTFLAGS="" \
    && make install \
    && rm -r /tmp/pgvector \
    && apk del --purge .build-deps
