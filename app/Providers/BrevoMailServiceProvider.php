<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Mail;
use App\Mail\BrevoTransport;
use Symfony\Component\Mailer\Transport\Dsn;

class BrevoMailServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Mail::extend('brevo', function (array $config = []) {
            return new BrevoTransport($config['api_key']);
        });
    }
}