"use server";

export interface WaitlistData {
  email: string;
  name: string;
  role: "shop" | "sell";
  company?: string;
  productType?: string;
}

/**
 * Server action to submit a user's details to the waitlist Google Sheet.
 * If GOOGLE_SCRIPT_URL is not configured, it will simulate a successful mock submission.
 */
export async function submitWaitlist(data: WaitlistData) {
  const url = process.env.GOOGLE_SCRIPT_URL;

  if (!url) {
    console.warn("GOOGLE_SCRIPT_URL is not configured. Mocking waitlist submission:");
    console.warn(JSON.stringify(data, null, 2));
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      mock: true,
      message: "Successfully simulated submission (GOOGLE_SCRIPT_URL not set)." 
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      // Automatically redirect if Google Script Web App responds with 302
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned status ${response.status}`);
    }

    const result = await response.json();
    
    if (result && result.success === false) {
      throw new Error(result.error || "Google Apps Script internal execution failure");
    }

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
