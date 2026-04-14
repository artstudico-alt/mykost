# Laravel Dockerfile for Railway
# Build argument to bust cache
ARG CACHE_BUST=1
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libpq \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    libxml2-dev \
    && docker-php-ext-install pdo_pgsql pgsql mbstring xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy dari backend folder (Railway build context = root)
COPY backend/composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy semua code dari backend folder
COPY backend/ .

# Storage link only (safe at build time)
RUN php artisan storage:link || true

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy start script - force rebuild
COPY backend/start.sh /start.sh
RUN chmod +x /start.sh && cat /start.sh | head -5

# Railway assigns PORT dynamically, no need to EXPOSE
CMD ["/start.sh"]
