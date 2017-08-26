FROM nginx:1.10-alpine

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf
