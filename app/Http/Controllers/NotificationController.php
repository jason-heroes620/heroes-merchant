<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = $user->notifications()->latest();

        if ($request->has('unread') && $request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        $notifications = $query->get();

        \Log::info('Retrieved notifications', [
            'user_id' => $user->id,
            'total_count' => $notifications->count(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $notifications,
                    'unread_count' => $user->unreadNotifications()->count(),
                ],
            ]);
        }

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

        \Log::info('Push notification token saved', [
            'user_id' => $user->id,
            'token_preview' => substr($request->token, 0, 20) . '...',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Push notification token saved successfully',
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        
        $notification = $user->notifications()
            ->where('id', $id)
            ->firstOrFail();

        if (!$notification->read_at) {
            $notification->markAsRead();
            
            \Log::info('Notification marked as read', [
                'user_id' => $user->id,
                'notification_id' => $id,
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read successfully',
                'data' => [
                    'notification' => $notification,
                    'unread_count' => $user->unreadNotifications()->count(),
                ],
            ]);
        }

        return back()->with('success', 'Notification marked as read');
    }

    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        
        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications->markAsRead();

        \Log::info('All notifications marked as read', [
            'user_id' => $user->id,
            'count' => $count,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "{$count} notifications marked as read",
                'data' => [
                    'marked_count' => $count,
                ],
            ]);
        }

        return back()->with('success', 'All notifications marked as read');
    }

}

