<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'wantekmeita@gmail.com';
$user = \App\Models\User::where('email', $email)->first();

if ($user) {
    echo "User found: " . $user->email . "\n";
    echo "Email Verified At: " . ($user->email_verified_at ? $user->email_verified_at->toDateTimeString() : "NULL") . "\n";
    echo "Password Hashed: " . (strlen($user->password) > 0 ? "YES" : "NO") . "\n";
} else {
    echo "User not found: " . $email . "\n";
}
