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
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #f97316;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #f97316;
            font-size: 22px;
            margin-bottom: 5px;
        }
        .header p {
            margin: 3px 0;
            color: #666;
            font-size: 9px;
        }
        .merchant-info {
            background: #fff5f0;
            padding: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #f97316;
            font-size: 9px;
        }
        .month-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .month-header {
            background: #f97316;
            color: white;
            padding: 8px 12px;
            margin-bottom: 12px;
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
        .summary-grid {
            display: table;
            width: 100%;
        }
        .summary-item {
            display: inline-block;
            width: 48%;
            margin-right: 2%;
        }
        .summary-label {
            font-weight: bold;
            color: #666;
        }
        .summary-value {
            font-size: 11px;
            font-weight: bold;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background: #f3f4f6;
            padding: 6px 4px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #d1d5db;
            font-size: 8px;
        }
        td {
            padding: 5px 4px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 9px;
            vertical-align: top;
        }
        .booking-details {
            margin-top: 6px;
            padding: 6px;
            background: #f9fafb;
            border-left: 2px solid #9ca3af;
        }
        .booking-details h5 {
            margin: 0 0 4px 0;
            font-size: 8px;
            color: #666;
        }
        .booking-item {
            margin-bottom: 6px;
            padding: 4px;
            background: white;
            border: 1px solid #e5e7eb;
        }
        .booking-code {
            font-weight: bold;
            font-size: 8px;
            margin-bottom: 3px;
        }
        .item-row {
            display: table;
            width: 100%;
            font-size: 8px;
            margin: 2px 0;
        }
        .item-cell {
            display: table-cell;
            padding: 2px 4px;
        }
        .text-right {
            text-align: right;
        }
        .text-green {
            color: #16a34a;
            font-weight: bold;
        }
        .text-blue {
            color: #2563eb;
        }
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
        .status-requested {
            background: #dbeafe;
            color: #1e40af;
        }
        .status-paid {
            background: #d1fae5;
            color: #065f46;
        }
        .status-locked {
            background: #f3f4f6;
            color: #374151;
        }
        .grand-total {
            background: #f0fdf4;
            padding: 12px;
            margin-top: 20px;
            border: 2px solid #16a34a;
        }
        .grand-total h3 {
            color: #16a34a;
            margin: 0 0 8px 0;
            font-size: 12px;
        }
        .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            color: #666;
            font-size: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Merchant Payout Report</h1>
        <p><strong>Report Type:</strong> {{ $mode === 'admin' ? 'Admin View' : 'Merchant View' }}</p>
        <p><strong>Generated:</strong> {{ $generatedAt }}</p>
        <p><strong>Period:</strong> Last 6 Months</p>
    </div>

    @if($merchant)
    <div class="merchant-info">
        <strong>Merchant:</strong> {{ $merchant->company_name }}<br>
        <strong>Contact:</strong> {{ $merchant->user->full_name ?? 'N/A' }}
    </div>
    @endif

    @foreach($monthlyData as $monthName => $data)
    <div class="month-section">
        <div class="month-header">
            {{ $monthName }}
        </div>

        <div class="month-summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Bookings:</span>
                    <span class="summary-value">{{ $data['total_bookings'] }}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Payout:</span>
                    <span class="summary-value text-green">RM {{ number_format($data['total_amount'], 2) }}</span>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 35%;">Event & Bookings</th>
                    <th style="width: 12%; text-align: center;">Date</th>
                    <th style="width: 10%; text-align: center;">Bookings</th>
                    <th style="width: 15%; text-align: right;">Amount (RM)</th>
                    <th style="width: 13%; text-align: center;">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['payouts'] as $payout)
                <tr>
                    <td>
                        <strong>{{ $payout['event_title'] }}</strong>
                        
                        @if(isset($payout['booking_details']) && count($payout['booking_details']) > 0)
                        <div class="booking-details">
                            <h5>Booking Details ({{ count($payout['booking_details']) }} booking(s)):</h5>
                            @foreach($payout['booking_details'] as $booking)
                            <div class="booking-item">
                                <div class="booking-code">Code: {{ $booking['booking_code'] }}</div>
                                @foreach($booking['items'] as $item)
                                <div class="item-row">
                                    <div class="item-cell" style="width: 30%;">{{ $item['age_group'] }}</div>
                                    <div class="item-cell" style="width: 15%;">Qty: {{ $item['quantity'] }}</div>
                                    <div class="item-cell" style="width: 25%;">@ RM {{ number_format($item['price_per_unit'], 2) }}</div>
                                    <div class="item-cell text-green" style="width: 30%;">= RM {{ number_format($item['price_per_unit'] * $item['quantity'], 2) }}</div>
                                </div>
                                @if($mode === 'admin' && isset($item['paid_credits']))
                                <div class="item-row" style="font-size: 7px; color: #666;">
                                    <div class="item-cell" style="width: 50%;">Credits: Paid {{ $item['paid_credits'] }}, Free {{ $item['free_credits'] }}</div>
                                </div>
                                @endif
                                @endforeach
                            </div>
                            @endforeach
                        </div>
                        @endif
                    </td>
                    <td style="text-align: center;">{{ $payout['date'] ? \Carbon\Carbon::parse($payout['date'])->format('Y-m-d') : '-' }}</td>
                    <td style="text-align: center;">{{ $payout['total_bookings'] ?? 0 }}</td>
                    <td style="text-align: right;" class="text-green">{{ number_format($payout['total_amount'], 2) }}</td>
                    <td style="text-align: center;">
                        <span class="status-badge status-{{ $payout['status'] }}">
                            {{ ucfirst($payout['status']) }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach

    <!-- Grand Total -->
    <div class="grand-total">
        <h3>6-Month Summary</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Total Bookings:</span>
                <span class="summary-value">{{ array_sum(array_column($monthlyData, 'total_bookings')) }}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Payout:</span>
                <span class="summary-value text-green">RM {{ number_format(array_sum(array_column($monthlyData, 'total_amount')), 2) }}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This is a system-generated report. For questions, please contact support.</p>
        <p>Generated on {{ now()->format('l, F j, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>