-- Test Query: Verify WANKR Transaction Data
-- Purpose: Check if there are WANKR transactions in the database
-- No parameters needed

SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT "from") as unique_senders,
  COUNT(DISTINCT "to") as unique_recipients,
  MIN(block_time) as earliest_transaction,
  MAX(block_time) as latest_transaction,
  SUM(CAST(value AS DECIMAL)) / 1e18 as total_wankr_volume
FROM erc20_base.evt_transfer 
WHERE contract_address = 0xa207c6e67cea08641503947ac05c65748bb9bb07
  AND block_time >= CURRENT_DATE - interval '30' day  -- Last 30 days
