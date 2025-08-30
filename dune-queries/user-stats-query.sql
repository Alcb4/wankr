-- Dune Query ID: 5684552 (Corrected Version)
-- User Stats Query
-- Purpose: Pre-calculated user stats for performance
-- Parameters: user_address (string)

WITH user_transactions AS (
  SELECT 
    "from",
    "to",
    CAST(value AS DECIMAL(38,0)) / 1e18 as wankr_amount,
    evt_block_time -- Using the correct column name
  FROM erc20_base.evt_Transfer 
  WHERE contract_address = 0xa207c6e67cea08641503947ac05c65748bb9bb07
    -- Direct comparison works for varbinary and is case-insensitive
    AND ("from" = {{user_address}} OR "to" = {{user_address}})
    AND CAST(value AS DECIMAL(38,0)) <= 10 * 1e18  -- Only shame transactions
)

SELECT 
  {{user_address}} as address,
  
  -- Total transaction count
  COUNT(*) as total_transactions,
  
  -- Conditional counts for received vs. sent
  COUNT(*) FILTER (WHERE "to" = {{user_address}}) as shames_received,
  COUNT(*) FILTER (WHERE "from" = {{user_address}}) as shames_sent,
  
  -- Conditional sums for received vs. sent
  COALESCE(SUM(wankr_amount) FILTER (WHERE "to" = {{user_address}}), 0) as total_wankr_received,
  COALESCE(SUM(wankr_amount) FILTER (WHERE "from" = {{user_address}}), 0) as total_wankr_sent,
  
  -- Conditional unique count for shamers
  COUNT(DISTINCT "from") FILTER (WHERE "to" = {{user_address}}) as unique_shamers,
  
  -- Min/Max for timestamps
  MAX(evt_block_time) as last_activity,
  MIN(evt_block_time) as first_activity,
  
  -- Conditional max for shame-free streak calculation
  COALESCE(
    DATE_DIFF('day', MAX(evt_block_time) FILTER (WHERE "to" = {{user_address}}), NOW()),
    999 -- Fallback for users with no received shame
  ) as shame_free_days,
  
  -- Conditional count for recent activity
  COUNT(*) FILTER (WHERE "to" = {{user_address}} AND evt_block_time >= NOW() - interval '7' day) as recent_shames_received,
  
  -- Conditional average for shame amount
  COALESCE(AVG(wankr_amount) FILTER (WHERE "to" = {{user_address}}), 0) as avg_shame_amount

FROM user_transactions
