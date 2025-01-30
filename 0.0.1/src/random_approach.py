import random
from typing import Dict
import logging

LOGGER = logging.getLogger(__name__)


def suggest_token_quantities(
    token_balances: Dict[str, float],
    target_usd_amount: int,
    token_prices: Dict[str, float],
    max_attempts: int = 1000,
    diversity_factor: float = 0.33  # Controls how much of each token can be exhausted
) -> Dict[str, float]:
    """
    Suggests token quantities to sell to meet a target USD amount while maintaining token diversity.

    Args:
      token_balances: Dict mapping token addresses to their quantities
      target_usd_amount: Target USD amount (6 decimal places)
      token_prices: Dict mapping token addresses to their USD prices
      max_attempts: Maximum number of random attempts to find a solution
      diversity_factor: Maximum proportion of any token that can be used

    Returns:
      Dict mapping token addresses to quantities to sell
    """
    target_usd = target_usd_amount / 1_000_000  # Convert to actual USD amount
    best_solution = None
    min_difference = float('inf')

    # Exit early if we have insufficient price information for the set of
    # tokens
    valid_tokens = [addr for addr in token_balances.keys()
                    if addr in token_prices]
    if len(valid_tokens) != len(token_balances):
        LOGGER.error(
            f"exiting early: price info not found for some token(s) in {token_balances.keys()} where price info is available for {token_prices.keys()}")
        return {}

    for _ in range(max_attempts):
        solution = {}
        current_usd = 0

        # Randomly shuffle tokens to ensure different combinations
        shuffled_tokens = random.sample(valid_tokens, len(valid_tokens))

        for token_addr in shuffled_tokens:
            if current_usd >= target_usd:
                break

            # Only apply diversity factor if there are multiple token types
            if len(token_balances) > 1:
                max_token_quantity = token_balances[token_addr] * \
                    diversity_factor
            else:
                max_token_quantity = token_balances[token_addr]
            token_price = token_prices[token_addr]

            # Calculate remaining USD needed
            remaining_usd = target_usd - current_usd

            if token_price <= 0:
                continue

            # Calculate random quantity of this token to use (up to max
            # allowed)
            max_quantity_for_remaining = remaining_usd / token_price
            actual_quantity = min(
                max_token_quantity,
                max_quantity_for_remaining,
                token_balances[token_addr]
            )

            # Use random portion of the maximum possible quantity unless
            # there's only one token type
            if len(token_balances) == 1:
                quantity_to_use = actual_quantity
            else:
                quantity_to_use = random.uniform(0, actual_quantity)

            if quantity_to_use > 0:
                solution[token_addr] = quantity_to_use
                current_usd += quantity_to_use * token_price

        # Check if this solution is better than previous ones
        difference = abs(current_usd - target_usd)

        # Check if it's within acceptable range before updating best_solution
        if difference / target_usd < 0.0001:
            if difference < min_difference:
                min_difference = difference
                best_solution = solution.copy()
        elif best_solution is None:
            best_solution = {}

    return best_solution
