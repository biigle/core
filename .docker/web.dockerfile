FROM biigle/app:arm32v6 as intermediate

FROM arm32v6/alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apk add --no-cache nginx

EXPOSE 80

RUN ln -sf /dev/stdout /var/log/nginx/access.log
RUN ln -sf /dev/stderr /var/log/nginx/error.log
RUN mkdir -p /run/nginx

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

CMD ["nginx", "-g", "daemon off;"]
