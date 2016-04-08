#!/bin/bash

set -e

# If you would like to do some extra provisioning you may
# add any commands you wish to this file and they will
# be run after the Homestead machine is provisioned.

# run the database migrations
php /home/vagrant/dias/artisan migrate --force

echo "Configuring queue worker daemon..."
# create the queue worker daemon managed by supervisor
sudo cat > /etc/supervisor/conf.d/laravel-worker.conf <<__EOF__
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/vagrant/dias/artisan queue:work --sleep=3 --tries=3 --daemon
autostart=true
autorestart=true
user=vagrant
numprocs=1
__EOF__

# start the queue worker
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
