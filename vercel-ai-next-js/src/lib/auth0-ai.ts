import { Auth0AI } from '@auth0/ai-vercel';
import { AccessDeniedInterrupt } from '@auth0/ai/interrupts';
import { getUser } from './auth0';

// Initialize Auth0AI with the regular web application
const auth0AI = new Auth0AI();

// CIBA flow for shopping with user confirmation
export const withAsyncAuthorization = auth0AI.withAsyncUserConfirmation({
  userID: async () => {
    const user = await getUser();
    return user?.sub as string;
  },
  bindingMessage: async ({ product, qty }) => `Purchase approval: ${qty} ${product}`,
  scopes: ['openid', 'product:buy'],
  audience: process.env['SHOP_API_AUDIENCE']!,
  onAuthorizationRequest: 'block', // Wait for user approval
  onUnauthorized: async (e: Error) => {
    console.error('[auth0-ai] Shopping authorization failed:', e);
    if (e instanceof AccessDeniedInterrupt) {
      return 'The user has denied the request';
    }
    // Handle CIBA-specific errors more gracefully
    if (e.message?.includes('CIBA_USER_DOES_NOT_HAVE_PUSH_NOTIFICATIONS')) {
      return 'CIBA authorization requires proper setup. Please ensure your Auth0 tenant and application are configured for CIBA with polling mode.';
    }
    return `Authorization failed: ${e.message}`;
  },
});