#!/bin/bash

rm -rf public/doc/
php vendor/bin/sami.php update sami.php -v
gulp docs
gulp apidoc