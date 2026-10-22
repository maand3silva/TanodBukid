<?php
declare(strict_types=1);
require __DIR__ . '/otp-common.php';
require_method('POST');
$data = read_json_request();
$token = $data['reset_token'] ?? '';
$password = $data['password'] ?? '';
if (!is_string($token) || preg_match('/^[a-f0-9]{64}$/D',$token)!==1 || !is_string($password) || !valid_reset_password($password)) json_response(['success'=>false,'message'=>'Invalid reset session or password. Use at least 8 characters with uppercase, lowercase, number, and symbol, no spaces.'],422);
$pdo = pdo_connection();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM password_reset_otps WHERE verified_token_hash=:hash AND consumed_at IS NULL LIMIT 1 FOR UPDATE');
    $stmt->execute(['hash'=>hash('sha256',$token)]);
    $row = $stmt->fetch();
    if (!$row || strtotime($row['verified_until'].' UTC') < time()) otp_fail($pdo,400,'Reset session expired. Request another code.');
    $hash = password_hash($password, PASSWORD_DEFAULT);
    if ($hash === false) throw new RuntimeException('Password hashing failed');
    $pdo->prepare('UPDATE users SET password_hash=:hash WHERE id=:id')->execute(['hash'=>$hash,'id'=>$row['user_id']]);
    $pdo->prepare('UPDATE password_reset_otps SET consumed_at=UTC_TIMESTAMP() WHERE id=:id')->execute(['id'=>$row['id']]);
    $pdo->commit();
    json_response(['success'=>true,'message'=>'Password changed. Please sign in.']);
} catch(Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('TanodBukid reset password error: '.$e->getMessage());
    json_response(['success'=>false,'message'=>'Unable to change the password.'],500);
}
