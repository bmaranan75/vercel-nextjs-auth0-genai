import { tool } from 'ai';
import { z } from 'zod';
import { getCIBACredentials } from '@auth0/ai-vercel';
import { withAsyncAuthorization } from '../auth0-ai';

// The main tool export, wrapped with async authorization
export const shopOnlineTool = withAsyncAuthorization(
  tool({
    description: 'Tool to buy products online with human-in-the-loop authorization',
    parameters: z.object({
      product: z.string(),
      qty: z.number(),
      priceLimit: z.number().optional(),
    }),
    execute: async ({ product, qty, priceLimit }) => {
      // Log the purchase attempt
      console.log(`[shop-online] Ordering ${qty} of ${product} with a price limit of ${priceLimit}`);

      const apiUrl = process.env['SHOP_API_URL']!;
      if (!apiUrl) {
        // If no API URL, mock the response (useful for dev/testing)
        console.log('[shop-online] SHOP_API_URL not set, mocking response.');
        return `✅ Successfully ordered ${qty} ${product} (mock purchase - CIBA authorization completed)`;
      }
      console.log(`[shop-online] Calling shop API at ${apiUrl}`);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: '',
      };
      const body = { product, qty, priceLimit };
      console.log('[shop-online] Request body:', body);

      // Get CIBA credentials (access token) after user approval
      const credentials = getCIBACredentials();
      const accessToken = credentials?.accessToken;
      if (accessToken) {
        headers['Authorization'] = 'Bearer ' + accessToken;
        console.log('[shop-online] Access token found, adding Authorization header.');
      } else {
        console.log('[shop-online] No access token found.');
      }

      try {
        // Make the purchase API call
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        });
        console.log(`[shop-online] Response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[shop-online] API request failed with status ${response.status}: ${errorText}`);
          throw new Error(`Request failed with status ${response.status}`);
        }
        const responseData = await response.json();
        console.log('[shop-online] Response data:', responseData);
        return `✅ Successfully ordered ${qty} ${product} for ${priceLimit ? `under $${priceLimit}` : 'any price'}`;
      } catch (error) {
        console.error('[shop-online] An error occurred during the API call:', error);
        throw error;
      }
    },
  }),
);