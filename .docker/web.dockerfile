# FROM nginx:1.21-alpine
FROM nginx@sha256:5a0df7fb7c8c03e4158ae9974bfbd6a15da2bdfdeded4fb694367ec812325d31
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>
LABEL org.opencontainers.image.source https://github.com/biigle/core

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf
ADD .docker/ffdhe2048.txt /etc/nginx/conf.d/ffdhe2048.txt
ADD .docker/headers.include /etc/nginx/conf.d/headers.include
ADD .docker/ssl.include /etc/nginx/conf.d/ssl.include.special

# Create an alternative configuration for HTTP only. This can be activated by using the
# nginx-no-ssl.conf instead of the default one. To do this set the command in the Docker
# Compose file:
# command: nginx -g 'daemon off;' -c /etc/nginx/nginx-no-ssl.conf
ADD .docker/vhost-no-ssl.conf /etc/nginx/conf.d/vhost-no-ssl.conf.alternative
RUN sed -e 's!include /etc/nginx/conf.d/\*.conf!include /etc/nginx/conf.d/vhost-no-ssl.conf.alternative!' /etc/nginx/nginx.conf > /etc/nginx/nginx-no-ssl.conf

COPY public /var/www/public

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
