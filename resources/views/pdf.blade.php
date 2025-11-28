<!DOCTYPE html>
    <html>
    <head>
        <title>Customer Transactions</title>
        <style>
            body { font-family: DejaVu Sans, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; }
            h2 { margin-bottom: 5px; }
        </style>
    </head>
    <body>

    <h2>{{ $customer->user->full_name }}</h2>
    <p>Email: {{ $customer->user->email }}</p>
    <p>Date: {{ now()->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, H:i:s') }}</p>

    <h3>Wallet Summary</h3>
    <table>
        <tr>
            <th>Free Credits</th>
            <td>{{ $wallet->free_credits }}</td>
        </tr>
        <tr>
            <th>Paid Credits</th>
            <td>{{ $wallet->paid_credits }}</td>
        </tr>
    </table>

    <h3>Credit Grants</h3>
    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Free Credits</th>
                <th>Paid Credits</th>
                <th>Free Credits Remaining</th>
                <th>Paid Credits Remaining</th>
                <th>Created At</th>
                <th>Expires At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($credit_grants as $grant)
            <tr>
                <td>{{ strtoupper($grant->grant_type) }}</td>
                <td>{{ $grant->free_credits }}</td>
                <td>{{ $grant->paid_credits }}</td>
                <td>{{ $grant->free_credits_remaining }}</td>
                <td>{{ $grant->paid_credits_remaining }}</td>
                <td>{{ $grant->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, H:i') }}</td>
                <td>{{ $grant->expires_at ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h3>Transactions</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>∆ Free</th>
                <th>∆ Paid</th>
                <th>Total Change</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $t)
            <tr>
                <td>{{ $t->created_at }}</td>
                <td>{{ strtoupper($t->type) }}</td>
                <td>{{ $t->description }}</td>
                <td>{{ $t->delta_free }}</td>
                <td>{{ $t->delta_paid }}</td>
                <td>{{ $t->delta_free + $t->delta_paid }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    </body>
</html>
