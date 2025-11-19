<?php

namespace App\Services;

use GuzzleHttp\Client;

class ExpoNotificationService
{
    protected $client;
    protected $endpoint = 'https://exp.host/--/api/v2/push/send';

    public function __construct()
    {
        $this->client = new Client();
    }

    public function sendPush($expoToken, $title, $body, $data = [])
    {
        if (!str_starts_with($expoToken, 'ExponentPushToken')) {
            return false;
        }

        $payload = [
            'to' => $expoToken,
            'sound' => 'default',
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ];

        try {
            $response = $this->client->post($this->endpoint, [
                'json' => $payload,
            ]);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            \Log::error('Expo push failed: ' . $e->getMessage());
            return false;
        }
    }
}
