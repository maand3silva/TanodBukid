<?php
declare(strict_types=1);

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$protectedPages = [
    '/profile-setup.html',
    '/dashboard.html',
    '/dashboard/index.html',
    '/dist/profile-setup.html',
    '/dist/dashboard.html',
    '/dist/dashboard/index.html',
];

if (in_array($path, $protectedPages, true)) {
    require __DIR__ . '/api/common.php';
    start_app_session();
    if (session_user() === null) {
        header('Location: /index.html#signin', true, 302);
        exit;
    }
}

return false;
