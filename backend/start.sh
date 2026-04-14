#!/bin/sh
set -e

PORT=${PORT:-8000}
echo "=== Starting with PORT: $PORT ==="

# Generate nginx config
cat > /etc/nginx/http.d/default.conf << EOF
server {
    listen ${PORT};
    server_name localhost;
    root /var/www/html/public;
    index index.php;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

echo "=== Nginx config generated ==="
cat /etc/nginx/http.d/default.conf

# Run database migration
echo "=== Running database migration ==="
cd /var/www/html
php artisan migrate --force 2>/dev/null || echo "migration skipped (check DB connection)"
echo "=== Migration done ==="

# Cache Laravel configs (skip errors if env not configured)
echo "=== Caching Laravel configs ==="
php artisan config:clear 2>/dev/null || echo "config:clear skipped"
php artisan route:clear 2>/dev/null || echo "route:clear skipped"
php artisan view:clear 2>/dev/null || echo "view:clear skipped"
php artisan config:cache 2>/dev/null || echo "config:cache skipped (check APP_KEY)"
php artisan route:cache 2>/dev/null || echo "route:cache skipped"
php artisan view:cache 2>/dev/null || echo "view:cache skipped"
echo "=== Laravel cache done ==="

# Start php-fpm
echo "=== Starting php-fpm ==="
/usr/local/sbin/php-fpm --daemonize
sleep 2

# Check php-fpm
if ! pgrep php-fpm > /dev/null 2>&1; then
    echo "ERROR: php-fpm failed to start"
    exit 1
fi
echo "=== php-fpm is running ==="

# Test nginx config
echo "=== Testing nginx config ==="
/usr/sbin/nginx -t || echo "WARNING: nginx config test failed"

# Check if we can bind to the port
echo "=== Checking port availability ==="
netstat -tlnp 2>/dev/null | grep -E "(tcp|${PORT})" || echo "Port check skipped"

# Start nginx
echo "=== Starting nginx ==="
exec /usr/sbin/nginx -g "daemon off;"
