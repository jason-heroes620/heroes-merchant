<?php

namespace App\Services;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class PushNotificationService
{
    public static function send(string $token, string $title, string $body, array $data = [])
    {
        \Log::info('PushNotificationService::send called', compact('token','title','body','data'));

        if (empty($token)) {
            \Log::warning('No push token provided, skipping send');
            return null;
        }

        // Expo token
        if (str_starts_with($token, 'ExponentPushToken') || str_contains($token, 'ExpoPushToken')) {
            try {
                return self::sendExpo($token, $title, $body, $data);
            } catch (\Throwable $e) {
                \Log::error('Expo push send failed', ['error' => $e->getMessage(), 'token' => $token]);
                return null;
            }
        }

        // FCM token
        if (empty(config('services.fcm.server_key'))) {
            \Log::warning('FCM server key not configured, skipping FCM push');
            return null;
        }

        try {
            return self::sendFcm($token, $title, $body, $data);
        } catch (\Throwable $e) {
            \Log::error('FCM push send failed', ['error' => $e->getMessage(), 'token' => $token]);
            return null;
        }
    }

    protected static function sendExpo(string $token, string $title, string $body, array $data = [])
    {
        $client = new Client(['base_uri' => 'https://exp.host/--/api/v2/']);
        $payload = [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ];

        $response = $client->post('push/send', [
            'json' => $payload,
            'headers' => ['Accept' => 'application/json'],
            'timeout' => 10,
        ]);

        return json_decode((string) $response->getBody(), true);
    }

    protected static function sendFcm(string $token, string $title, string $body, array $data = [])
    {
        $serverKey = config('services.fcm.server_key');
        $client = new Client(['base_uri' => 'https://fcm.googleapis.com/']);

        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ];

        $response = $client->post('fcm/send', [
            'json' => $payload,
            'headers' => [
                'Authorization' => "key={$serverKey}",
                'Content-Type' => 'application/json',
            ],
            'timeout' => 10,
        ]);

        return json_decode((string) $response->getBody(), true);
    }
}
