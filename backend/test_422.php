<?php
$ch = curl_init('http://127.0.0.1:8000/api/auth/register');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
// Deliberately missing name and password to force 422 validation
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'duplicate@gmail.com'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Status: $httpcode\n";
echo "Response Body:\n$result\n";
