# Apl_jsx

Apl_jsx is a full-stack business application built with Laravel, React, Inertia.js, TypeScript, and Tailwind CSS. It provides a modular foundation for dashboards, administration, employee hierarchy, location reporting, procurement, sales, role-based access, Microsoft authentication, and device-aware activity tracking.

## Technology Stack

- Laravel 13 and PHP 8.3+
- React 19 and TypeScript
- Inertia.js 2
- Vite 6
- Tailwind CSS 4
- MySQL or another Laravel-supported database
- Pest and PHPUnit

## Requirements

- PHP 8.3 or later with the extensions required by Laravel
- Composer 2
- Node.js 22 LTS or later and npm 10+
- MySQL 8 or MariaDB 10.6+
- Git

Required PHP extensions include `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd`, `intl`, `mbstring`, `mysqli`, `openssl`, `pdo_mysql`, `session`, `simplexml`, `sodium`, `tokenizer`, `xml`, `xmlwriter`, and `zip`.

Verify the runtime before installation:

```powershell
php -v
php --ini
php -m
composer --version
node --version
npm --version
```

> **PHP requirement:** This Laravel 13 project requires PHP 8.3 or newer. An older XAMPP Apache running PHP 8.2 returns HTTP 500 even when a separate PHP 8.3+ CLI is installed. Apache and the command line must both use compatible PHP versions.

## Local Setup (Windows/XAMPP)

Clone the repository into the XAMPP web directory:

```powershell
cd D:\xampp\htdocs
git clone https://github.com/avnishkumar1986/Apl_jsx.git rectified
cd rectified
```

Install the backend and frontend dependencies:

```powershell
composer install
npm ci
composer check-platform-reqs
```

Create the local environment file and application key:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Configure the database and other required integrations in `.env`. Never commit `.env` or real credentials.

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Kolkata
APP_URL=http://127.0.0.1:8002

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rectified
DB_USERNAME=rectified_user
DB_PASSWORD=<local-password>

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
```

Create the database, then run:

```powershell
php artisan optimize:clear
php artisan migrate --seed
php artisan storage:link
```

Start each development service in a separate terminal, using free ports:

```powershell
php artisan serve --host=127.0.0.1 --port=8002
npx vite --host=127.0.0.1 --port=5174 --strictPort
php artisan queue:work --tries=3 --timeout=300
php artisan schedule:work
```

Open `http://127.0.0.1:8002`. Do not stop or reuse ports owned by another project.

### XAMPP Apache virtual host

Apache must use PHP 8.3+. Add this to `apache\conf\extra\httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    ServerName rectified.local
    DocumentRoot "D:/xampp/htdocs/rectified/public"

    <Directory "D:/xampp/htdocs/rectified/public">
        AllowOverride All
        Options FollowSymLinks
        Require all granted
    </Directory>

    ErrorLog "logs/rectified-error.log"
    CustomLog "logs/rectified-access.log" combined
</VirtualHost>
```

Add `127.0.0.1 rectified.local` to the Windows hosts file, restart Apache, and open `http://rectified.local`. The document root must be the `public` directory.

## Useful Commands

```powershell
# Run automated tests
php artisan test

# Build production assets
npm run build

# Check frontend formatting
npm run format:check

# Apply frontend formatting
npm run format

# Run the linter
npm run lint

# Clear Laravel caches
php artisan optimize:clear
```

## AWS Deployment

The recommended production architecture uses:

- Amazon EC2 for Laravel, PHP-FPM, Nginx, and the queue worker
- Amazon RDS for MySQL
- Amazon S3 for persistent file storage when required
- AWS Certificate Manager with an Application Load Balancer, or Certbot on the instance, for HTTPS
- CloudWatch for logs and monitoring

Recommended request path:

```text
Route 53
  -> Application Load Balancer with ACM TLS certificate
    -> EC2 or an EC2 Auto Scaling group
      -> Nginx
        -> PHP-FPM 8.3+
          -> Laravel

Laravel -> RDS MySQL
Laravel -> ElastiCache Redis or Amazon SQS
Laravel -> S3
Laravel -> CloudWatch
Secrets -> Systems Manager Parameter Store or Secrets Manager
```

### 1. Create AWS infrastructure

1. Select one AWS Region.
2. Create a VPC across at least two Availability Zones.
3. Place the ALB in public subnets and EC2/RDS in private subnets where practical.
4. Create RDS MySQL 8 with automated backups and deletion protection.
5. Create a private S3 bucket with public access blocked and versioning enabled when required.
6. Create an EC2 IAM role containing only the required S3, SQS, SSM, Secrets Manager, and CloudWatch permissions.
7. Request and validate an ACM certificate for the application domain.
8. Configure the ALB HTTPS listener and redirect HTTP to HTTPS.
9. Create a Route 53 alias record pointing to the ALB.
10. Create CloudWatch alarms for unhealthy targets, 5xx responses, CPU, disk, queue failures, and RDS capacity.

Recommended security-group rules:

- ALB: inbound ports 80 and 443 from the internet.
- EC2: application traffic only from the ALB security group; administration through Session Manager or approved IP addresses.
- RDS: port 3306 only from the EC2 security group.
- Redis: port 6379 only from the EC2 security group.

Never expose RDS, Redis, or PHP-FPM directly to the internet.

### 2. Prepare the server

Create an Amazon Linux 2023 EC2 instance and install Nginx, PHP-FPM 8.3+, Composer, Node.js 22 LTS, npm, Git, and the PHP extensions required by Laravel. Use the same PHP version for the CLI and PHP-FPM.

Example installation outline:

```bash
sudo dnf update -y
sudo dnf install -y git nginx php8.3 php8.3-fpm php8.3-cli php8.3-mysqlnd \
  php8.3-bcmath php8.3-gd php8.3-intl php8.3-mbstring php8.3-opcache \
  php8.3-process php8.3-soap php8.3-xml php8.3-zip
```

Package names can vary by AMI and PHP stream. Verify them before installation. Install Composer using its official verified installer.

### 3. Deploy the application

```bash
sudo mkdir -p /var/www/apl-jsx
sudo chown -R $USER:www-data /var/www/apl-jsx
git clone --branch main --single-branch https://github.com/avnishkumar1986/Apl_jsx.git /var/www/apl-jsx
cd /var/www/apl-jsx

composer install --no-dev --optimize-autoloader
npm ci
npm run build
```

Use a read-only deploy key, GitHub App, or CI artifact for a private repository. Do not place a personal access token in shell history.

Set production values in `.env` through a secure deployment process or AWS Systems Manager Parameter Store. At minimum, configure `APP_URL`, database credentials, mail, queue, cache, Microsoft authentication, API tokens, and any S3 settings used by the application.

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
APP_TIMEZONE=Asia/Kolkata

DB_CONNECTION=mysql
DB_HOST=<rds-endpoint>
DB_PORT=3306
DB_DATABASE=<database-name>
DB_USERNAME=<database-user>
DB_PASSWORD=<secure-password>

FILESYSTEM_DISK=s3
AWS_DEFAULT_REGION=<aws-region>
AWS_BUCKET=<bucket-name>

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=<redis-endpoint>
REDIS_PORT=6379
```

When the EC2 instance uses an IAM role for S3 access, leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` unset. This avoids storing long-lived AWS credentials on the server.

Generate `APP_KEY` once for a new production environment with `php artisan key:generate --show`, store it securely, and reuse it for later deployments. Do not rotate it during routine releases.

### 4. Configure permissions and Laravel

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Never apply permission `777` to the entire project. Only `storage` and `bootstrap/cache` require web-server write access.

Configure Nginx with `/var/www/apl-jsx/public` as the document root:

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/apl-jsx/public;
    index index.php;

    client_max_body_size 50m;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Validate and start Nginx and PHP-FPM:

```bash
sudo nginx -t
sudo systemctl enable --now php-fpm nginx
```

Create `/etc/systemd/system/apl-jsx-queue.service`:

```ini
[Unit]
Description=Apl JSX Laravel Queue Worker
After=network.target

[Service]
User=nginx
Group=nginx
Restart=always
RestartSec=5
WorkingDirectory=/var/www/apl-jsx
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --timeout=300 --max-time=3600
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable the worker:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now apl-jsx-queue
```

Run Laravel's scheduler every minute:

```cron
* * * * * cd /var/www/apl-jsx && php artisan schedule:run >> /dev/null 2>&1
```

The project schedules API-log cleanup, procurement lock release, procurement synchronization, and monthly security auditing. Verify with `php artisan schedule:list`.

### 5. Production updates

```bash
cd /var/www/apl-jsx
git pull --ff-only
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize
php artisan queue:restart
```

Use a maintenance window or an atomic deployment strategy for production systems that require zero downtime.

### 6. Rollback

Before deployment, record the current Git commit, create an RDS snapshot, preserve `.env` and `APP_KEY`, and retain the previous release.

```bash
git checkout <previous-known-good-commit>
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
npm ci
npm run build
php artisan optimize
php artisan queue:restart
```

Do not automatically run `migrate:rollback` in production. Restore a tested snapshot when schema or data rollback is unsafe.

### 7. Production verification

- DNS resolves to the ALB and HTTP redirects to HTTPS.
- The TLS certificate is valid and ALB targets are healthy.
- `APP_ENV=production` and `APP_DEBUG=false`.
- `.env`, `.git`, and secrets are not web-accessible.
- Login, dashboard, and permission-controlled routes work.
- RDS is reachable only from the application security group.
- Migrations are current.
- Queue workers process jobs and the scheduler runs every minute.
- Microsoft SSO redirect URLs match the production HTTPS hostname exactly.
- S3 access works through the EC2 IAM role.
- Logs reach CloudWatch without exposing secrets.
- RDS backups and restore procedures have been tested.

### 8. Monitoring and backups

- Send Nginx, PHP-FPM, Laravel, and system logs to CloudWatch.
- Alert on ALB 5xx responses, unhealthy targets, CPU, memory, disk, queue failures, and RDS capacity.
- Enable RDS automated backups, snapshots, deletion protection, and restore testing.
- Enable S3 versioning and lifecycle rules where required.
- Rotate Laravel logs to prevent disk exhaustion.
- Coordinate upload limits across the ALB, Nginx, PHP, and Laravel validation.

## Security

- Never commit `.env`, private keys, access tokens, database dumps, or cloud credentials.
- Keep `APP_DEBUG=false` in production.
- Use HTTPS and secure cookies in production.
- Prefer IAM roles and short-lived credentials on AWS.
- Limit RDS, EC2, and S3 permissions to the minimum required.
- Rotate integration secrets and review application logs regularly.

## Branches

- `main` contains the stable application history.
- `react` contains the Laravel/React code intended for collaborative development and deployment.

## License

This project is intended for internal use unless a separate license is provided by the repository owner.
