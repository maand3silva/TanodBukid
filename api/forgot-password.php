<?php
declare(strict_types=1);
require __DIR__ . '/otp-common.php';
require_method('POST');
$data = read_json_request();
$mobile = normalize_mobile_number(is_string($data['mobile_number'] ?? null) ? $data['mobile_number'] : '');
if ($mobile === null) json_response(['success' => false, 'message' => 'Enter a valid Philippine mobile number.'], 422);
if (!otp_dev_enabled()) json_response(['success' => false, 'message' => 'SMS delivery has not been configured.'], 503);
$pdo = pdo_connection();
$pdo->beginTransaction();
try {
    $user = otp_user_from_mobile($pdo, $mobile);
    if (!$user) otp_fail($pdo, 404, 'No test account is registered with this number.');
    $userId = (int)$user['id'];
    // Lock the account row to serialize requests, even if an OTP row does not exist yet.
    $lock = $pdo->prepare('SELECT id FROM users WHERE id = :id FOR UPDATE');
    $lock->execute(['id' => $userId]);
    $last = otp_latest($pdo, $userId);
    if ($last && strtotime($last['last_sent_at'].' UTC') > time() - 60) otp_fail($pdo, 429, 'Please wait 60 seconds before requesting another code.');
    $code = (string) random_int(100000, 999999);
    $hash = hash('sha256', $code);
    $pdo->prepare('UPDATE password_reset_otps SET consumed_at = UTC_TIMESTAMP() WHERE user_id = :id AND consumed_at IS NULL')->execute(['id' => $userId]);
    $insert = $pdo->prepare('INSERT INTO password_reset_otps (user_id, code_hash, expires_at, last_sent_at) VALUES (:id, :hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), UTC_TIMESTAMP())');
    $insert->execute(['id'=>$userId,'hash'=>$hash]);
    $pdo->commit();
    json_response(['success'=>true,'message'=>'Development-only simulated SMS code generated.','dev_otp'=>$code,'expires_in_seconds'=>300]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('TanodBukid forgot password error: '.$e->getMessage());
    json_response(['success'=>false,'message'=>'Unable to generate a reset code.'],500);
}
