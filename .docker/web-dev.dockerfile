FROM nginx:1.10-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf
