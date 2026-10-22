<?php
declare(strict_types=1);
require_once __DIR__ . '/common.php';

function otp_dev_enabled(): bool {
    return getenv('TANODBUKID_DEV_OTP') === '1';
}
function otp_user_from_mobile(PDO $pdo, string $mobile): ?array {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE mobile_number = :mobile LIMIT 1');
    $stmt->execute(['mobile' => $mobile]);
    $result = $stmt->fetch();
    return $result ?: null;
}
function otp_latest(PDO $pdo, int $userId, bool $lock = false): ?array {
    $stmt = $pdo->prepare('SELECT * FROM password_reset_otps WHERE user_id = :id ORDER BY id DESC LIMIT 1' . ($lock ? ' FOR UPDATE' : ''));
    $stmt->execute(['id' => $userId]);
    return $stmt->fetch() ?: null;
}
function valid_reset_password(string $value): bool {
    return strlen($value) >= 8 && strlen($value) <= 72
        && preg_match('/[A-Z]/', $value) === 1
        && preg_match('/[a-z]/', $value) === 1
        && preg_match('/[0-9]/', $value) === 1
        && preg_match('/[^\p{L}\p{N}\s]/u', $value) === 1
        && preg_match('/\s/u', $value) !== 1;
}
function otp_fail(PDO $pdo, int $status, string $message): never {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_response(['success' => false, 'message' => $message], $status);
}
