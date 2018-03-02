FROM biigle/app:arm32v6 as intermediate

FROM arm32v6/alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apk add --no-cache nginx

EXPOSE 80

RUN ln -sf /dev/stdout /var/log/nginx/access.log
RUN ln -sf /dev/stderr /var/log/nginx/error.log
RUN mkdir -p /run/nginx

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf

COPY --from=intermediate /var/www/public /var/www/public

CMD ["nginx", "-g", "daemon off;"]
