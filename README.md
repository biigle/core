# BIIGLE

Benthic Image Indexing, Graphical Labeling and Exploration

## Requirements

- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation

### For Production

Run `docker-compose build` to build the `biigle/app`, `biigle/web` and `biigle/worker` Docker images.

Now head over to [biigle-distribution](https://github.com/BiodataMiningGroup/biigle-distribution) to configure and build your production setup.

### For Development

To develop BIIGLE on your local machine you may use Docker containers, too. This way you don't need to install any of the requirements like Python or special PHP extensions and keep your development environment clearly separated from your regular OS.

Set up the project in the current directory (using [Composer](https://getcomposer.org/doc/00-intro.md)):

```
composer create-project biigle/core --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/biigle-core.git"}' --keep-vcs --ignore-platform-reqs .
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the Docker containers.

Now you can run `docker-compose up` to build and run the ensemble of Docker containers. The first time may take a while. The BIIGLE application is now running at `http://localhost:8000`. Stop the containers with `docker-compose stop`. Destroy them (and the development database) with `docker-compose down`.

Run the tests with `docker-compose run --rm worker php -d memory_limit=1G vendor/bin/phpunit`. The first time may fail since the database container needs to start up.

For BIIGLE module development you should install the modules with the `--prefer-source` flag to keep Composer from deleting the VCS files (eg `.git`). Example:

```
composer require --prefer-source biigle/projects
```
