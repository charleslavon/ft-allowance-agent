import { ACCOUNT_ID, PLUGIN_URL } from "@/app/config";
import { NextResponse } from "next/server";

export async function GET() {
    const pluginData = {
        openapi: "3.0.0",
        info: {
            title: "DivvyWealth",
            description: "...",
            version: "1.0.0",
        },
        servers: [
            {
                url: PLUGIN_URL,
            },
        ],
"x-mb": {
    "account-id": ACCOUNT_ID,
    assistant: {
        name: "Divvy",
        description: "Divvy is an AI agent that helps users automatically secure profits by converting crypto gains into stablecoins based on portfolio growth targets. It monitors your portfolio value and executes trades when conditions are met.",
        image: `${pluginUrl}/icon.svg`,
        instructions: `Divvy helps users set up and monitor automated profit-taking through portfolio allowances. Here are the key functions:

1. Portfolio Monitoring: Check current balances and USD values of supported tokens using /get-balance. Use charts to visualize portfolio growth over time.

2. Allowance Setup: Help users create allowances with clear parameters:
   - Target growth rate (e.g., "Convert when portfolio grows 20%")
   - Allowance amount (e.g., "$200 in USDC")
   - Frequency (e.g., "every two weeks")
   
3. Allowance Management: Users can remove their current allowance setup if needed.

When users inquire about their portfolio or allowances:
- Show current portfolio value and recent growth trends using charts
- Explain allowance settings in clear terms
- Confirm actions before executing transactions
- Provide status updates on existing allowances

Remember: Focus on helping users understand their portfolio growth and automate profit-taking. Don't provide financial advice - stick to executing user-defined strategies.`,
        tools: [
            {
                type: "render-chart"
            },
            {
                type: "generate-transaction"
            }
        ],
    },
},
paths: {
    "/api/tools/get-balance": {
        get: {
            summary: "Get portfolio balance",
            description: "Returns current balance of supported tokens and their USD value",
            operationId: "getBalance",
            responses: {
                "200": {
                    description: "Successful response",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    tokens: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                symbol: { type: "string" },
                                                balance: { type: "string" },
                                                usdValue: { type: "string" }
                                            }
                                        }
                                    },
                                    totalUsdValue: { type: "string" }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "/api/tools/create-allowance": {
        post: {
            summary: "Create new allowance",
            description: "Setup a new recurring allowance with target growth rate",
            operationId: "createAllowance",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                targetGrowthRate: { type: "string" },
                                allowanceAmount: { type: "string" },
                                frequency: { type: "string" },
                                stablecoin: { type: "string", enum: ["USDT", "USDC"] }
                            },
                            required: ["targetGrowthRate", "allowanceAmount", "frequency", "stablecoin"]
                        }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Allowance created successfully"
                }
            }
        }
    },
    "/api/tools/remove-allowance": {
        post: {
            summary: "Remove allowance",
            description: "Remove an existing allowance configuration",
            operationId: "removeAllowance",
            responses: {
                "200": {
                    description: "Allowance removed successfully"
                }
            }
        }
    }
}
    };

    return NextResponse.json(pluginData);
}
