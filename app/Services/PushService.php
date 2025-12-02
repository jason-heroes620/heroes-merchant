<?php

namespace App\Services;

use GuzzleHttp\Client;

class PushService
{
    public static function send(string $token, string $title, string $body, array $data = [])
    {
        // If token looks like Expo push token  -> use Expo
        if (str_starts_with($token, 'ExponentPushToken') || str_contains($token, 'ExpoPushToken')) {
            return self::sendExpo($token, $title, $body, $data);
        }

        // Otherwise fallback to FCM (assume token is FCM)
        return self::sendFcm($token, $title, $body, $data);
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
