export async function getQuotes(tokenInId, quantity, assetIdentifierOut) {
  const BASE_URL = "https://solver-relay-v2.chaindefuser.com/rpc";
  const payload = {
    method: "quote",
    params: [{
      defuse_asset_identifier_in: tokenInId,
      defuse_asset_identifier_out: assetIdentifierOut,
      exact_amount_in: String(quantity),
      min_deadline_ms: 60000
    }],
    id: "dontcare",
    jsonrpc: "2.0"
  };

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const resData = await response.json();
    const data = resData.result || [];
    let quotes = [];
    let bestUsdValue = { usd_value: 0 };

    if (Array.isArray(data)) {
      data.forEach((quote) => {
        const usdValue = parseInt(quote.amount_out || "0", 10);
        quotes.push({
          usd_value: usdValue,
          token_in: quote.defuse_asset_identifier_in,
          token_out: quote.defuse_asset_identifier_out,
          amount_in: quote.amount_in,
          amount_out: quote.amount_out,
          expiration_time: quote.expiration_time
        });

        if (usdValue > bestUsdValue.usd_value) {
          bestUsdValue = {
            quote_hash: quote.quote_hash,
            amount_in: quote.amount_in,
            token_in: quote.defuse_asset_identifier_in,
            token_out: quote.defuse_asset_identifier_out,
            amount_out: quote.amount_out,
            usd_value: usdValue,
            expiration_time: quote.expiration_time
          };
        }
      });
    }

    return { quotes, bestQuote: bestUsdValue };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return { quotes: [], bestQuote: {} };
  }
}
