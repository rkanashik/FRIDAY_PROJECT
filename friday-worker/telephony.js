/**
 * TelephonyProvider Interface and Exotel Implementation
 * Handles the interaction with the telephony service provider.
 */

export class TelephonyProvider {
  async initiateOutgoingCall(to, from, callbackUrl) {
    throw new Error("Not implemented");
  }
  async terminateCall(callSid) {
    throw new Error("Not implemented");
  }
  async getCallDetails(callSid) {
    throw new Error("Not implemented");
  }
}

export class ExotelProvider extends TelephonyProvider {
  constructor(env) {
    super();
    this.apiKey = env.EXOTEL_API_KEY;
    this.apiToken = env.EXOTEL_API_TOKEN;
    this.accountId = env.EXOTEL_ACCOUNT_ID;
    this.baseUrl = "https://api.exotel.com/v1";
  }

  /**
   * Initiates an outbound call via Exotel.
   * @param {string} to - The destination phone number.
   * @param {string} from - The FRIDAY virtual number.
   * @param {string} callbackUrl - The webhook URL for call events.
   */
  async initiateOutgoingCall(to, from, callbackUrl) {
    const url = `${this.baseUrl}/Calls/create`;
    const params = new URLSearchParams({
      From: from,
      To: to,
      Url: callbackUrl,
      CallerId: from,
      ApiKey: this.apiKey,
      ApiToken: this.apiToken,
      AccountId: this.accountId
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Exotel Outbound Call failed: ${error}`);
    }
    const data = await response.json();
    return data.sid; // Return the Exotel Call SID
  }

  /**
   * Terminates an active call.
   * @param {string} callSid - The Exotel Call SID.
   */
  async terminateCall(callSid) {
    const url = `${this.baseUrl}/Calls/${callSid}/terminate`;
    const params = new URLSearchParams({
      ApiKey: this.apiKey,
      ApiToken: this.apiToken,
      AccountId: this.accountId
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Exotel Terminate Call failed: ${await response.text()}`);
    }
    return true;
  }

  async getCallDetails(callSid) {
    const url = `${this.baseUrl}/Calls/${callSid}`;
    const params = new URLSearchParams({
      ApiKey: this.apiKey,
      ApiToken: this.apiToken,
      AccountId: this.accountId
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Exotel Get Call Details failed: ${await response.text()}`);
    }
    return await response.json();
  }
}
