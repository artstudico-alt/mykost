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

# Cache Laravel configs
echo "=== Caching Laravel configs ==="
cd /var/www/html
php artisan config:cache 2>/dev/null || echo "config:cache skipped"
php artisan route:cache 2>/dev/null || echo "route:cache skipped"  
php artisan view:cache 2>/dev/null || echo "view:cache skipped"

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

# Start nginx
echo "=== Starting nginx ==="
exec /usr/sbin/nginx -g "daemon off;"
