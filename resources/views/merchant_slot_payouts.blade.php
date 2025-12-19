<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Merchant Payout Report</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.5;
            padding: 20px;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 3px solid #f97316;
            padding-bottom: 14px;
        }

        .header h1 {
            color: #f97316;
            font-size: 22px;
            margin-bottom: 6px;
        }

        .header p {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
        }

        /* Merchant */
        .merchant-info {
            background: #fff5f0;
            padding: 10px;
            margin-bottom: 18px;
            border-left: 4px solid #f97316;
            font-size: 9px;
        }

        /* Month Section */
        .month-section {
            page-break-inside: avoid;
        }

        .month-header {
            background: #f97316;
            color: #fff;
            padding: 8px 12px;
            margin-bottom: 10px;
            font-size: 12px;
            font-weight: bold;
        }

        .month-summary {
            background: #fef3c7;
            padding: 8px 10px;
            margin-bottom: 12px;
            border-left: 4px solid #f59e0b;
            font-size: 9px;
        }

        .summary-item {
            display: inline-block;
            width: 48%;
        }

        .summary-label {
            font-weight: bold;
            color: #666;
        }

        .summary-value {
            font-size: 11px;
            font-weight: bold;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #f3f4f6;
            padding: 6px 4px;
            font-size: 8px;
            text-align: left;
            border-bottom: 2px solid #d1d5db;
        }

        td {
            padding: 6px 4px;
            font-size: 9px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-green {
            color: #16a34a;
            font-weight: bold;
        }

        /* Status */
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: bold;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .status-paid {
            background: #d1fae5;
            color: #065f46;
        }

        .status-requested {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-locked {
            background: #f3f4f6;
            color: #374151;
        }

        /* Booking item table */
        .booking-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 8.5px;
        }

        .booking-table th,
        .booking-table td {
            border: 1px solid #e5e7eb;
            padding: 3px 4px;
        }

        .booking-header {
            background: #f3f4f6;
            font-weight: bold;
        }

        /* Footer */
        .footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 8px;
            color: #666;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <h1>Merchant Payout Report</h1>
        <p><strong>View:</strong> {{ $mode === 'admin' ? 'Admin' : 'Merchant' }}</p>
        <p><strong>Period:</strong> {{ $month }}</p>
        <p><strong>Generated:</strong> {{ $generatedAt }}</p>
    </div>

    @if($mode === 'admin')
        @foreach($monthData['payouts'] as $merchantId => $merchantPayout)
            <div class="merchant-info">
                <strong>Merchant:</strong> {{ $merchantPayout['merchant_company'] ?? 'N/A' }}
            </div>

            <div class="month-section">
                <div class="month-header">
                    {{ $month }}
                </div>

                <div class="month-summary">
                    <div class="summary-item">
                        <span class="summary-label">Total Bookings:</span>
                        <span class="summary-value">{{ $merchantPayout['total_bookings'] ?? 0 }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Payout:</span>
                        <span class="summary-value text-green">
                            RM {{ number_format($merchantPayout['total_amount'] ?? 0, 2) }}
                        </span>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 21%;">Event</th>
                            <th style="width: 35%;" class="text-center">Slot Time</th>
                            <th style="width: 12%;" class="text-center">Bookings</th>
                            <th style="width: 17%;" class="text-right">Amount (RM)</th>
                            <th style="width: 15%;" class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($merchantPayout['events'] as $event)
                            @foreach($event['slots'] as $slot)
                                <tr>
                                    <td>
                                        <strong>{{ $event['event_title'] }}</strong>
                                    </td>
                                    <td class="text-center">
                                        {{ \Carbon\Carbon::parse($slot['slot_start'])->format('Y-m-d H:i') }}
                                        –
                                        {{ \Carbon\Carbon::parse($slot['slot_end'])->format('H:i') }}
                                    </td>
                                    <td class="text-center">
                                        {{ count($slot['booking_breakdown'] ?? []) }}
                                    </td>
                                    <td class="text-right text-green">
                                        {{ number_format($slot['subtotal'] ?? 0, 2) }}
                                    </td>
                                    <td class="text-center">
                                        <span class="status-badge status-{{ $slot['status'] ?? 'pending' }}">
                                            {{ ucfirst($slot['status'] ?? 'Pending') }}
                                        </span>
                                    </td>
                                </tr>
                            @endforeach
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endforeach

        <!-- Admin Month End Total -->
        <div class="month-summary" style="margin-top: 12px;">
            <div class="summary-item">
                <span class="summary-label">Month End Total:</span>
                <span class="summary-value text-green">
                    RM {{ number_format($monthData['total_amount'] ?? 0, 2) }}
                </span>
            </div>
        </div>

    @else
        <!-- Merchant view -->
        <div class="merchant-info">
            <strong>Merchant:</strong> {{ $merchant->company_name ?? 'N/A' }}
        </div>

        <div class="month-section">
            <div class="month-header">{{ $month }}</div>

            <div class="month-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Bookings:</span>
                    <span class="summary-value">{{ $monthData['total_bookings'] ?? 0 }}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Payout:</span>
                    <span class="summary-value text-green">
                        RM {{ number_format($monthData['total_amount'] ?? 0, 2) }}
                    </span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 21%;">Event</th>
                        <th style="width: 35%;" class="text-center">Slot Time</th>
                        <th style="width: 12%;" class="text-center">Bookings</th>
                        <th style="width: 17%;" class="text-right">Amount (RM)</th>
                        <th style="width: 15%;" class="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($monthData['payouts'] as $event)
                        @foreach($event['slots'] as $slot)
                            <tr>
                                <td>
                                    <strong>{{ $event['event_title'] }}</strong>

                                    <!-- Booking breakdown table -->
                                    @if(!empty($slot['booking_breakdown']))
                                        <table class="booking-table">
                                            <thead>
                                                <tr class="booking-header">
                                                    <th>Age Group</th>
                                                    <th>Qty</th>
                                                    <th>Price (RM)</th>
                                                    <th>Total (RM)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach($slot['booking_breakdown'] as $item)
                                                    <tr>
                                                        <td>{{ $item['age_group_label'] }}</td>
                                                        <td class="text-center">{{ $item['quantity'] }}</td>
                                                        <td class="text-right">{{ number_format($item['price_in_rm'] ?? 0, 2) }}</td>
                                                        <td class="text-right">{{ number_format($item['total_amount'] ?? 0, 2) }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    @endif
                                </td>
                                <td class="text-center">
                                    {{ \Carbon\Carbon::parse($slot['slot_start'])->format('Y-m-d H:i') }}<br>
                                    –<br>
                                    {{ \Carbon\Carbon::parse($slot['slot_end'])->format('H:i') }}
                                </td>
                                <td class="text-center">
                                    {{ count($slot['booking_breakdown'] ?? []) }}
                                </td>
                                <td class="text-right text-green">
                                    {{ number_format($slot['subtotal'] ?? 0, 2) }}
                                </td>
                                <td class="text-center">
                                    <span class="status-badge status-{{ $slot['status'] ?? 'pending' }}">
                                        {{ ucfirst($slot['status'] ?? 'Pending') }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
    <div class="footer">
        This is a system-generated report.
    </div>

</body>
</html>
