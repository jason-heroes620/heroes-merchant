{{-- resources/views/emails/purchase-confirmation.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Purchase!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 650px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #4f46e5;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-decoration: none;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            margin-bottom: 20px;
            font-size: 16px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .summary-table th {
            text-align: left;
            padding: 12px 15px;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            color: #475569;
        }
        .summary-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .summary-table tr:last-child td {
            border-bottom: none;
        }
        .total-row {
            font-weight: bold;
            background-color: #f8fafc;
        }
        .thank-you {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 16px;
            color: #475569;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
            margin-top: 20px;
        }
        .highlight {
            color: #4f46e5;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div  class="email-header">
                <img src="{{ $message->embed(public_path('/img/heroes-logo.png')) }}" alt="" width="120" class="email-logo">
            </div>    
            <h1>Thank You for Your Purchase!</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                <p>Hi {{ $name ?? 'Valued Customer' }},</p>
                <p>We're thrilled to confirm your purchase! Thank you for choosing us—we truly appreciate your support.</p>
            </div>

            <h4 style="color: #1e293b; margin: 25px 0 15px;">Order Summary ({{ $order->order_number }})</h4>
            
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align: right;">Quantity</th>
                        <th>UOM</th>
                        <th style="text-align: right;">Price</th>
                        <th style="text-align: right;">Total (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($orderProducts as $product)
                    <tr>
                        <td>{{ $product->product_name }}</td>
                        <td style="text-align: right;">{{ $product->qty }}</td>
                        <td style="text-align: center;">{{ $product->uom }}</td>
                        <td style="text-align: right;">{{ $product->price }}</td>
                        <td style="text-align: right;">{{ $product->total }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right;">Total Payment:</td>
                        <td style="text-align: right;">RM{{ $order->total }}</td>
                    </tr>
                </tbody>
            </table>

            <div>
                <p>We’ve attached your booking details and QR code for our upcoming event at <strong>Paradigm Mall (Jan 24–25, 2026)</strong>. Simply present them at the venue to enjoy unlimited access to our activity stations. We are also excited to announce that our new <strong>Heroes Mobile App</strong> is launching soon—we’ll send you an update so you can easily manage your bookings on the go!</p>
            </div>
            <div class="thank-you">
                <p>Your support means the world to us! If you have any questions about your order or need assistance, feel free to contact our friendly support team at <a href="mailto:help@heroes.my">help@heroes.my</a> or call us at 012 7456 785.</p>
                <p>Warm Regards,<br>
                <strong>Heroes Event Team</strong></p>
            </div>
            <div>

            <div style="padding: 10px;">
                {!! $qrCodeSvg !!}
            </div>
        </div>

        <div class="footer">
            <p>This is an automated message—please do not reply directly to this email.</p>
            <p>&copy; {{ date('Y') }} Heroes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>