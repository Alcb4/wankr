# Dune Queries for WANKR User Stats

This directory contains the Dune queries needed for the Farcaster Mini App to fetch real user statistics.

## Queries

### 1. User Transactions Query (ID: 5684382)
**File**: `user-transactions-received.sql` (Updated with your improved query)

**Purpose**: Get all WANKR transactions for a specific user address with direction
**Parameters**: 
- `user_address` (string): The Ethereum address to query

**Returns**:
- `from`: Sender address
- `to`: Recipient address
- `wankr_amount`: Human-readable WANKR amount (rounded)
- `evt_block_time`: Transaction timestamp
- `evt_tx_hash`: Transaction hash
- `direction`: 'Sent' or 'Received' for clear distinction

**Usage**: Used by the API to get all user transactions with direction information



### 2. User Stats Query (ID: 5684552)
**File**: `user-stats-query.sql`

**Purpose**: Pre-calculated user statistics for performance
**Parameters**:
- `user_address` (string): The Ethereum address to query

**Returns**:
- `address`: User address
- `total_transactions`: Total number of shame transactions
- `shames_received`: Number of shame transactions received
- `shames_sent`: Number of shame transactions sent
- `total_wankr_received`: Total WANKR received (≤10 per transaction)
- `total_wankr_sent`: Total WANKR sent (≤10 per transaction)
- `unique_shamers`: Number of unique addresses that sent shame
- `last_activity`: Most recent transaction timestamp
- `first_activity`: First transaction timestamp
- `shame_free_days`: Days since last received shame
- `recent_shames_received`: Shames received in last 7 days
- `avg_shame_amount`: Average amount per shame received

**Usage**: Used by the API for fast stats retrieval without client-side processing

## Setup Instructions

### 1. Create the Queries in Dune
1. Go to [Dune Analytics](https://dune.com)
2. Click "New Query"
3. Copy and paste the SQL from each file
4. Set the query name and description
5. Save the query and note the Query ID

### 2. Update Query IDs in Code
Update the Query IDs in `src/server/services/duneService.ts`:

```typescript
// User-specific query IDs
private readonly USER_TRANSACTIONS_QUERY_ID = 5684382; // ✅ Created and working
private readonly USER_STATS_QUERY_ID = 5684552; // ✅ Created and working
```

### 3. Test the Queries
1. Run each query with a test address
2. Verify the results match expected format
3. Check performance with addresses that have many transactions

## Query Features

### 🎯 Shame Transaction Filtering
- Only includes transactions ≤10 WANKR (shame threshold)
- Excludes large transactions that are likely trading

### ⚡ Performance Optimizations
- Uses CTEs (Common Table Expressions) for efficient processing
- Pre-calculates complex metrics server-side
- Limits results to prevent overwhelming responses

### 📊 Comprehensive Stats
- Transaction counts and amounts
- Unique shamer analysis
- Time-based metrics (shame-free days, recent activity)
- Average calculations for insights

## Example Usage

### Testing with a Real Address
```sql
-- Test the user stats query
-- Replace with an actual address that has WANKR transactions
SELECT * FROM user_stats_query WHERE address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
```

### Expected Results
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "total_transactions": 15,
  "shames_received": 8,
  "shames_sent": 7,
  "total_wankr_received": 45.5,
  "total_wankr_sent": 32.0,
  "unique_shamers": 6,
  "shame_free_days": 3,
  "recent_shames_received": 2,
  "avg_shame_amount": 5.69
}
```

## Troubleshooting

### Common Issues
1. **No Results**: Check if the address has WANKR transactions
2. **Slow Performance**: Add indexes or optimize the query
3. **Parameter Errors**: Ensure the `user_address` parameter is set correctly

### Performance Tips
- The queries are optimized for addresses with <1000 transactions
- For high-volume addresses, consider adding time-based filters
- Monitor query execution time and adjust limits as needed
