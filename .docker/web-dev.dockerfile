FROM nginx:1.10-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf

# Remove this line to prevent errors because of the self signed local development
# certificate
RUN sed -i '/add_header/d' /etc/nginx/conf.d/default.conf
