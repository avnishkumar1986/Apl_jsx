# Apl_jsx

Apl_jsx is a full-stack business application built with Laravel, React, Inertia.js, TypeScript, and Tailwind CSS. It provides a modular foundation for dashboards, administration, employee hierarchy, location reporting, procurement, sales, role-based access, Microsoft authentication, and device-aware activity tracking.

## Technology Stack

- Laravel 12 and PHP 8.2+
- React 19 and TypeScript
- Inertia.js 2
- Vite 6
- Tailwind CSS 4
- MySQL or another Laravel-supported database
- Pest and PHPUnit

## Requirements

- PHP 8.2 or later with the extensions required by Laravel
- Composer 2
- Node.js 20 LTS or later and npm
- MySQL 8 or MariaDB 10.6+
- Git

## Local Setup (Windows/XAMPP)

Clone the repository into the XAMPP web directory:

```powershell
cd D:\xampp\htdocs
git clone <repository-url> laravel_react
cd laravel_react
```

Install the backend and frontend dependencies:

```powershell
composer install
npm ci
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
APP_URL=http://127.0.0.1:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_react
DB_USERNAME=root
DB_PASSWORD=
```

Create the database, then run:

```powershell
php artisan migrate
composer run dev
```

The development command starts Laravel on `http://127.0.0.1:8001`, the queue listener, and the Vite development server.

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

### 1. Prepare the server

Create an Ubuntu EC2 instance and install Nginx, PHP 8.2+, Composer, Node.js 20+, npm, Git, and the PHP extensions required by Laravel. Restrict SSH and database access with security groups. Do not expose RDS publicly unless there is a specific operational requirement.

### 2. Deploy the application

```bash
sudo mkdir -p /var/www/apl-jsx
sudo chown -R $USER:www-data /var/www/apl-jsx
git clone <repository-url> /var/www/apl-jsx
cd /var/www/apl-jsx

composer install --no-dev --optimize-autoloader
npm ci
npm run build
cp .env.example .env
php artisan key:generate
```

Set production values in `.env` through a secure deployment process or AWS Systems Manager Parameter Store. At minimum, configure `APP_URL`, database credentials, mail, queue, cache, Microsoft authentication, API tokens, and any S3 settings used by the application.

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com

DB_CONNECTION=mysql
DB_HOST=<rds-endpoint>
DB_PORT=3306
DB_DATABASE=<database-name>
DB_USERNAME=<database-user>
DB_PASSWORD=<secure-password>

FILESYSTEM_DISK=s3
AWS_DEFAULT_REGION=<aws-region>
AWS_BUCKET=<bucket-name>
```

When the EC2 instance uses an IAM role for S3 access, leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` unset. This avoids storing long-lived AWS credentials on the server.

### 3. Finalize Laravel

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Configure Nginx with `/var/www/apl-jsx/public` as the document root and route requests through `public/index.php`. Run `php artisan queue:work` under Supervisor or systemd, and schedule Laravel tasks with cron:

```cron
* * * * * cd /var/www/apl-jsx && php artisan schedule:run >> /dev/null 2>&1
```

### 4. Production updates

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
