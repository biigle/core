#!/bin/bash

rm -rf doc/
php vendor/bin/sami.php update sami.php -v
gulp docs