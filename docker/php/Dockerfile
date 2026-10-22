FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libonig-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mysqli \
        mbstring \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html