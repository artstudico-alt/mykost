<?php
try {
    $host = 'db.hohlsvavqxmnatoujpxw.supabase.co';
    $port = '5432';
    $dbname = 'postgres';
    $user = 'postgres';
    $pass = '#Audrynoersyahdhani132';
    
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass);
    echo "SUCCESS: Connected to pgsql database!\n";
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
