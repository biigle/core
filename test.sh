#!/bin/bash

php artisan migrate:refresh --seed
# acceptance tests
php ./vendor/bin/codecept run

# unit-/functional tests
phpunit

# js unit tests
#npm test
