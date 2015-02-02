#!/bin/bash
php artisan migrate:refresh --seed
php ./vendor/bin/codecept run
