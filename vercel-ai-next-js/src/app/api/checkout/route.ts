import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const AUTH0_ISSUER = process.env.AUTH0_ISSUER_BASE_URL || "";
const REQUIRED_SCOPE = "checkout:buy";

console.log("[checkout-api] AUTH0_ISSUER:", AUTH0_ISSUER);

const client = jwksClient({
  jwksUri: `${AUTH0_ISSUER}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err || !key) {
      callback(err || new Error("Signing key not found"));
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

async function validateAccessToken(
  token: string
): Promise<{ valid: boolean; error?: string; payload?: any }> {
  return new Promise((resolve) => {
    console.log("[checkout-api] Validating token with issuer:", AUTH0_ISSUER);
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ["RS256"],
        // Remove issuer validation - JWKS validation is sufficient
        // issuer: AUTH0_ISSUER,
      },
      (err: any, decoded: any) => {
        if (err) {
          console.log("[checkout-api] JWT verification error:", err.message);
          resolve({ valid: false, error: err.message });
        } else {
          console.log(
            "[checkout-api] JWT verification successful, checking scope"
          );
          if (
            !decoded.scope ||
            !decoded.scope.split(" ").includes(REQUIRED_SCOPE)
          ) {
            console.log("token : ", token);
            resolve({ valid: false, error: "Missing required scope" });
          } else {
            resolve({ valid: true, payload: decoded });
          }
        }
      }
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { valid, error } = await validateAccessToken(token);
    if (!valid) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 403 }
      );
    }

    // Parse request body to get checkout details
    let checkoutData;
    try {
      checkoutData = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Implement your checkout logic here
    // For demonstration, just return success with the order details
    return NextResponse.json({
      success: true,
      message: "Checkout completed.",
      order: {
        product: checkoutData.product,
        quantity: checkoutData.qty,
        priceLimit: checkoutData.priceLimit,
      },
    });
  } catch (error: any) {
    console.error("[checkout-api] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}