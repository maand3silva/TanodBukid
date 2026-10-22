<?php
declare(strict_types=1);
require __DIR__ . '/otp-common.php';
require_method('POST');
$data = read_json_request();
$mobile = normalize_mobile_number(is_string($data['mobile_number'] ?? null) ? $data['mobile_number'] : '');
$code = $data['otp'] ?? '';
if ($mobile === null || !is_string($code) || preg_match('/^\d{6}$/D',$code) !== 1) json_response(['success'=>false,'message'=>'Enter your mobile number and six-digit code.'],422);
$pdo = pdo_connection();
$pdo->beginTransaction();
try {
    $user = otp_user_from_mobile($pdo, $mobile);
    if (!$user) otp_fail($pdo,400,'Invalid or expired reset code.');
    $row = otp_latest($pdo, (int)$user['id'], true);
    if (!$row || $row['consumed_at'] !== null || strtotime($row['expires_at'].' UTC') < time() || (int)$row['attempts'] >= 5 || $row['verified_token_hash'] !== null) otp_fail($pdo,400,'Invalid or expired reset code.');
    $pdo->prepare('UPDATE password_reset_otps SET attempts=attempts+1 WHERE id=:id')->execute(['id'=>$row['id']]);
    if (!hash_equals((string)$row['code_hash'], hash('sha256',$code))) {
        $pdo->commit();
        json_response(['success'=>false,'message'=>'Invalid code. Maximum five attempts.'],400);
    }
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('UPDATE password_reset_otps SET verified_token_hash=:hash, verified_until=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE) WHERE id=:id')->execute(['hash'=>hash('sha256',$token),'id'=>$row['id']]);
    $pdo->commit();
    json_response(['success'=>true,'message'=>'Code verified. Set a new password.','reset_token'=>$token]);
} catch(Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('TanodBukid verify OTP error: '.$e->getMessage());
    json_response(['success'=>false,'message'=>'Unable to verify the code.'],500);
}
