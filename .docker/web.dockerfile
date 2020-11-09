FROM docker.pkg.github.com/biigle/core/app:arm64v8 as intermediate

FROM arm64v8/nginx:alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf

# Create an alternative configuration for HTTP only. This can be activated by using the
# nginx-no-ssl.conf instead of the default one. To do this set the command in the Docker
# Compose file:
# command: nginx -g 'daemon off;' -c /etc/nginx/nginx-no-ssl.conf
ADD .docker/vhost-no-ssl.conf /etc/nginx/conf.d/vhost-no-ssl.conf.alternative
RUN sed -e 's!include /etc/nginx/conf.d/\*.conf!include /etc/nginx/conf.d/vhost-no-ssl.conf.alternative!' /etc/nginx/nginx.conf > /etc/nginx/nginx-no-ssl.conf

COPY --from=intermediate /var/www/public /var/www/public

ARG BIIGLE_VERSION
ENV BIIGLE_VERSION=${BIIGLE_VERSION}
