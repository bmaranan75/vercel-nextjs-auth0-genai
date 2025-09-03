import { tool } from "ai";
import { z } from "zod";
import { getCIBACredentials } from "@auth0/ai-vercel";
import { withAsyncPaymentAuthorization } from "../auth0-ai";

// The main tool export, wrapped with async authorization
export const addPaymentMethodTool = withAsyncPaymentAuthorization(
  tool({
    description:
      "Tool to add a new payment method with human-in-the-loop authorization",
    parameters: z.object({
      type: z.enum(["credit_card", "debit_card", "bank_account", "paypal"]).describe("Type of payment method"),
      cardNumber: z.string().optional().describe("Card number (for card types)"),
      expiryDate: z.string().optional().describe("Expiry date in MM/YY format (for card types)"),
      accountNumber: z.string().optional().describe("Account number (for bank account)"),
      routingNumber: z.string().optional().describe("Routing number (for bank account)"),
      email: z.string().optional().describe("Email address (for PayPal)"),
      isDefault: z.boolean().optional().describe("Set as default payment method"),
    }),
    execute: async (params) => {
      const { type, cardNumber, expiryDate, accountNumber, routingNumber, email, isDefault } = params;
      // Log the payment method addition attempt
      console.log(
        `[add-payment] Adding ${type} payment method${isDefault ? ' as default' : ''}`
      );

      // Use the ADD_PAYMENT_URL from environment or fallback to localhost
      const apiUrl = process.env.ADD_PAYMENT_URL || "http://localhost:3000/api/add-payment";
      const audience = process.env.ADD_PAYMENT_API_AUDIENCE || "http://localhost:3000/api/add-payment";
      console.log(`[add-payment] Using API URL: ${apiUrl}`);
      console.log(`[add-payment] Using API Audience: ${audience}`);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: "",
      };
      
      const body = { 
        type, 
        cardNumber, 
        expiryDate, 
        accountNumber, 
        routingNumber, 
        email, 
        isDefault 
      };
      console.log("[add-payment] Request body:", body);

      // Get CIBA credentials (access token) after user approval
      const credentials = getCIBACredentials();
      const accessToken = credentials?.accessToken;
      if (accessToken) {
        headers["Authorization"] = "Bearer " + accessToken;
        console.log(
          "[add-payment] Access token found, adding Authorization header."
        );
      } else {
        console.log("[add-payment] No access token found.");
      }

      try {
        // Make the add payment method API call
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        });
        console.log(`[add-payment] Response status: ${response.status}`);
        console.log(
          `[add-payment] Response content-type: ${response.headers.get("content-type")}`
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text();
          console.log(
            `[add-payment] Non-JSON response (status: ${response.status}): ${textResponse.substring(0, 500)}...`
          );
          console.log(`[add-payment] Response headers:`, Object.fromEntries(response.headers.entries()));
          throw new Error(
            `Expected JSON response but got ${contentType || "unknown content type"}. Status: ${response.status}. Response: ${textResponse.substring(0, 200)}`
          );
        }

        const responseData = await response.json();
        console.log("[add-payment] Response data:", responseData);
        if (!response.ok) {
          throw new Error(
            responseData?.error ||
              `Request failed with status ${response.status}`
          );
        }

        const paymentMethod = responseData?.paymentMethod;
        let successMessage = responseData?.message || "✅ Payment method added successfully";
        
        if (paymentMethod) {
          switch (type) {
            case "credit_card":
            case "debit_card":
              successMessage += ` - ${type.replace('_', ' ')} ending in ${paymentMethod.cardNumber?.slice(-4) || 'XXXX'}`;
              break;
            case "bank_account":
              successMessage += ` - Bank account ending in ${accountNumber?.slice(-4) || 'XXXX'}`;
              break;
            case "paypal":
              successMessage += ` - PayPal account: ${email}`;
              break;
          }
          
          if (paymentMethod.isDefault) {
            successMessage += " (set as default)";
          }
        }
        
        return successMessage;
      } catch (error) {
        console.error(
          "[add-payment] An error occurred during the API call:",
          error
        );
        throw error;
      }
    },
  })
);
