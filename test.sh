#!/bin/bash

# start phantomjs for acceptance tests
phantomjs --webdriver=4444 &
phantom_pid=$!

php artisan migrate:refresh --seed

# wait for phantomjs to start
sleep 2

# acceptance tests
php ./vendor/bin/codecept run

kill $phantom_pid

# unit-/functional tests
phpunit

# js unit tests
#npm test
