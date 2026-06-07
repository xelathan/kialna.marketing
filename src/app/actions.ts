export interface WaitlistData {
  email: string;
  name: string;
  role: "shop" | "sell";
  company?: string;
  productType?: string;
}

/**
 * Client-side utility to submit a user's details to the waitlist Google Sheet.
 * If NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not configured, it will simulate a successful mock submission.
 */
export async function submitWaitlist(data: WaitlistData) {
  const url = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

  if (!url) {
    console.warn("NEXT_PUBLIC_GOOGLE_SCRIPT_URL is not configured. Mocking waitlist submission:");
    console.warn(JSON.stringify(data, null, 2));
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      mock: true,
      message: "Successfully simulated submission (NEXT_PUBLIC_GOOGLE_SCRIPT_URL not set)." 
    };
  }

  try {
    // We use "text/plain" and no-cors to prevent CORS preflight OPTIONS requests,
    // which Google Apps Script Web Apps do not natively support or allow.
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(data),
    });

    // Note: With mode "no-cors", the response is opaque (status is 0, ok is false).
    // But if the request fails completely (e.g. network error), fetch will throw.
    // If it reaches here, the submission was sent successfully.
    return { 
      success: true, 
      mock: false 
    };
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to waitlist database."
    };
  }
}
