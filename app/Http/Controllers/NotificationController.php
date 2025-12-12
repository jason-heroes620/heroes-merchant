<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get all notifications for user
        $notifications = $user->notifications()->latest()->get();

        \Log::info('Fetched notifications for user', [
            'user_id' => $user->id,
            'notifications_count' => $notifications->count(),
            'notifications' => $notifications->toArray(),
        ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function saveToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();
        $user->update(['expo_push_token' => $request->token]);

        \Log::info('Expo token saved', [
            'user_id' => $user->id,
            'token' => $request->token
        ]);

        return response()->json(['message' => 'Expo token saved successfully']);
    }

    public function markAsRead($id)
    {
        $notification = Auth::user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        if (!$notification->read_at) {
            $notification->markAsRead();
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }
}

