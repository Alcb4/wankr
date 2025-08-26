-- Dune Query ID: 5684382 (Improved Single Query)
-- User Transactions Query with Direction
-- Purpose: Get all WANKR transactions for a specific user address with direction
-- Parameters: user_address (string)

SELECT
  "from",
  "to",
  ROUND(CAST(value AS DECIMAL(38, 0)) / 1e18) AS wankr_amount, -- Human-readable, whole integer amount
  evt_block_time, -- Correct column name
  evt_tx_hash,    -- Correct column name
  -- This CASE statement creates the 'direction' column for better UX
  CASE
    WHEN "from" = {{user_address}} THEN 'Sent'
    ELSE 'Received'
  END AS direction
FROM
  erc20_base.evt_Transfer
WHERE
  contract_address = 0xa207c6e67cea08641503947ac05c65748bb9bb07
  AND (
    "from" = {{user_address}}
    OR "to" = {{user_address}}
  )
  AND CAST(value AS DECIMAL(38, 0)) <= 10 * 1e18 -- Only shame transactions (≤10 WANKR)
ORDER BY
  evt_block_time DESC -- Correct column name
LIMIT
  1000 -- Limit to prevent overwhelming results
