/**
 * The expected shape of a successful JSON response from the bankr.bot API.
 */
interface BankrBotResponse {
  username: string;
  platform: string;
  accountId: string;
  evmAddress: string;
  solanaAddress: string;
  bankrClub: boolean;
}

/**
 * Resolves an X (Twitter) handle to a wallet address using the bankr.bot API.
 * 
 * @param username The X handle to resolve (e.g., "VitalikButerin" or "@VitalikButerin").
 * @returns The resolved EVM wallet address as a string, or null if not found or an error occurs.
 */
export async function resolveXHandleWithBankrBot(username: string): Promise<string | null> {
  // 1. Sanitize the input to make the function more robust.
  const sanitizedUsername = username.startsWith('@') ? username.substring(1) : username;

  // 2. Construct the full API URL.
  const apiUrl = `https://api.bankr.bot/public/wallet?username=${sanitizedUsername}&platform=twitter`;

  console.log(`Querying bankr.bot for handle: @${sanitizedUsername}`);

  try {
    // 3. Make the API call.
    const response = await fetch(apiUrl);

    // 4. Handle HTTP errors (e.g., user not found will likely be a 404).
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Handle @${sanitizedUsername} not found in bankr.bot's registry.`);
      } else {
        console.error(`bankr.bot API request failed with status: ${response.status}`);
      }
      return null;
    }

    // 5. Parse the JSON response and extract the wallet address.
    const data: BankrBotResponse = await response.json();

    if (data && data.evmAddress) {
      console.log(`Successfully resolved @${sanitizedUsername} to ${data.evmAddress}`);
      return data.evmAddress;
    } else {
      // This case handles a 200 OK response with empty or invalid data.
      console.log(`Handle @${sanitizedUsername} was found but has no associated wallet.`);
      return null;
    }

  } catch (error) {
    // 6. Handle network errors or other exceptions.
    console.error('An error occurred while fetching from the bankr.bot API:', error);
    return null;
  }
}
