# Laravel Dockerfile for Railway
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

# Start script dengan generate nginx config
RUN printf '#!/bin/sh\n\
PORT=${PORT:-8000}\n\
echo "Starting with PORT: $PORT"\n\
\n\
# Generate nginx config dengan PORT yang benar\n\
cat > /etc/nginx/http.d/default.conf << EOF\n\
server {\n\
    listen PORT_PLACEHOLDER;\n\
    server_name localhost;\n\
    root /var/www/html/public;\n\
    index index.php;\n\
    \n\
    location / {\n\
        try_files \$uri \$uri/ /index.php?\$query_string;\n\
    }\n\
    \n\
    location ~ \\.php$ {\n\
        fastcgi_pass 127.0.0.1:9000;\n\
        fastcgi_index index.php;\n\
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;\n\
        include fastcgi_params;\n\
    }\n\
}\n\
EOF\n\
\n\
# Replace placeholder dengan actual PORT\n\
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/http.d/default.conf\n\
\n\
echo "Nginx config:"\n\
cat /etc/nginx/http.d/default.conf\n\
\n\
# Clear and cache Laravel configs (at runtime when env vars are available)
echo "Caching Laravel configs..."
cd /var/www/html
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start php-fpm di background
echo "Starting php-fpm..."
/usr/local/sbin/php-fpm --daemonize
sleep 2\n\
\n\
# Cek php-fpm jalan\n\
if ! pgrep php-fpm > /dev/null; then\n\
    echo "ERROR: php-fpm failed to start"\n\
    exit 1\n\
fi\n\
echo "php-fpm is running"\n\
\n\
# Start nginx di foreground\n\
echo "Starting nginx..."\n\
exec /usr/sbin/nginx -g "daemon off;"\n\
' > /start.sh && chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"]
