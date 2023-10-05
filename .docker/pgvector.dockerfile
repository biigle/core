FROM postgres:14-alpine

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
