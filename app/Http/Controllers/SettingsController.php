<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    public function edit()
    {
        try {
            Log::info('Settings edit page accessed');
            
            $settings = [
                'registration_bonus' => (int) Setting::get('registration_bonus', 50),
                'registration_bonus_validity' => (int) Setting::get('registration_bonus_validity', 180),
                'referral_bonus' => (int) Setting::get('referral_bonus', 50),
                'referral_bonus_validity' => (int) Setting::get('referral_bonus_validity', 180), 
                'referral_threshold' => (int) Setting::get('referral_threshold', 3),
                'cancellation_policy_hours' => (int) Setting::get('cancellation_policy_hours', 24),
                'cancellation_policy_terms' => Setting::get('cancellation_policy_terms', 'Credits are forfeited if cancelled within 24 hours before the event.'),
            ];
            
            Log::info('Settings loaded successfully', $settings);
            
            return Inertia::render('Admin/Settings', [
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading settings page', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    public function update(Request $request)
    {
        try {
            Log::info('Settings update started', [
                'input' => $request->all()
            ]);
            
            $data = $request->validate([
                'registration_bonus' => 'required|integer|min:0',
                'registration_bonus_validity' => 'required|integer|min:1',
                'referral_bonus' => 'required|integer|min:0',
                'referral_threshold' => 'required|integer|min:1',
                'referral_bonus_validity' => 'required|integer|min:1',
                'cancellation_policy_hours' => 'required|integer|min:0',
                'cancellation_policy_terms' => 'required|string|max:500',
            ]);
            
            Log::info('Validation passed', ['data' => $data]);

            foreach ($data as $key => $value) {
                Log::info("Setting {$key} to {$value}");
                Setting::set($key, $value);
                Log::info("Successfully set {$key}");
            }
            
            Log::info('All settings updated successfully');

            return redirect()->back()->with('success', 'Settings updated successfully.');
            
        } catch (ValidationException $e) {
            Log::warning('Validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
                
        } catch (\Exception $e) {
            Log::error('Error updating settings', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->all()
            ]);
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update settings: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function apiGetSettings()
    {
        try {
            Log::info('API settings request');
            
            $settings = [
                'registration_bonus' => (int) Setting::get('registration_bonus', 0),
                'registration_bonus_validity' => (int) Setting::get('registration_bonus_validity', 180),
                'referral_bonus' => (int) Setting::get('referral_bonus', 0),
                'referral_bonus_validity' => (int) Setting::get('referral_bonus_validity', 180),
                'referral_threshold' => (int) Setting::get('referral_threshold', 3),
                'cancellation_policy_hours' => (int) Setting::get('cancellation_policy_hours', 24),
                'cancellation_policy_terms' => Setting::get('cacnelation_policy_terms', 'Credits are forfeited if cancelled within 24 hours before the event.'),
            ];
            
            Log::info('API settings returned', $settings);
            
            return response()->json($settings);
            
        } catch (\Exception $e) {
            Log::error('Error getting settings via API', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to retrieve settings',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}