
from random_approach import suggest_token_quantities
import logging

LOGGER = logging.getLogger(__name__)


def test_suggest_token_quantities_additional_cases():
    # Test with very small token prices
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 0.0000001}
    )
    assert isinstance(result, dict)
    # result should be empty as token price is too small to achieve target
    assert not result

    # Test with negative token prices (invalid case)
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": -1.0}
    )
    assert isinstance(result, dict)
    assert not result

    # Test with extremely high diversity factor > 1
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 1.0},
        diversity_factor=1.5
    )
    assert isinstance(result, dict)
    assert all(qty <= 100.0 for qty in result.values())

    # Test with very small number of max_attempts
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 1.0},
        max_attempts=1
    )
    assert isinstance(result, dict)
    assert result

    # Test with many tokens but only one with price data
    result = suggest_token_quantities(
        token_balances={
            "0x1": 100.0,
            "0x2": 100.0,
            "0x3": 100.0,
            "0x4": 100.0},
        target_usd_amount=1_000_000,
        token_prices={
            "0x1": 1.0})
    assert isinstance(result, dict)
    assert len(result) == 0

    # Test with a very low target amount
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1,  # $0.000001
        token_prices={"0x1": 1.0}
    )
    # TODO maybe add logic to ensure the result will be greater than the gas
    # fees of the required transactions
    LOGGER.info("recommended quantities %s", result)
    assert isinstance(result, dict)
    assert sum(qty * 1.0 for qty in result.values()) < 0.000002

    # Test with very large target amount exceeding available balance
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000_000_000,  # $1M
        token_prices={"0x1": 1.0}
    )
    assert isinstance(result, dict)
    assert not result

    # Test with zero token prices
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 0.0}
    )
    assert isinstance(result, dict)
    assert not result

    # Test with extreme diversity factor
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 1.0},
        diversity_factor=0.01
    )
    assert isinstance(result, dict)
    assert result
    assert all(qty <= 100.0 * 0.01 for qty in result.values())

    # Test with mix of valid and invalid tokens
    result = suggest_token_quantities(
        token_balances={"0x1": 100.0, "0x2": 200.0, "0x3": 300.0},
        target_usd_amount=1_000_000,
        token_prices={"0x1": 1.0, "0x3": 3.0}  # Missing price for 0x2
    )
    assert isinstance(result, dict)
    assert not result

    # Test a high target goal with serveral tokens
    token_balances = {
        "0x1": 113.559,
        "0x2": 214.667,
        "0x3": 343.584
    }

    token_prices = {
        "0x1": 1.0,
        "0x2": 2.0,
        "0x3": 3.0
    }
    target_usd = 500_000_000  # $500 in 6 decimal precision
    result = suggest_token_quantities(
        token_balances=token_balances,
        target_usd_amount=target_usd,
        token_prices=token_prices,
        diversity_factor=0.6,
        max_attempts=5000
    )

    LOGGER.info("recommended quantities %s", result)
    assert isinstance(result, dict)
    assert result
    # Check we don't exceed diversity factor
    for token, qty in result.items():
        assert qty <= token_balances[token] * 0.6

    # Check all tokens in result exist in original balances
    assert all(token in token_balances for token in result)

    # Check suggested quantities don't exceed balances
    assert all(qty <= token_balances[token] for token, qty in result.items())

    # Calculate total USD value
    total_usd = sum(qty * token_prices[token] for token, qty in result.items())

    # Check we're within 0.01% of target
    target_actual_usd = target_usd / 1_000_000
    assert abs(total_usd - target_actual_usd) / target_actual_usd < 0.0001

    def test_suggest_token_quantities_low_diversity():
        token_balances = {
            "0x1": 100.0,
            "0x2": 200.0,
            "0x3": 300.0,
            "0x4": 400.0,
            "0x5": 500.0,
            "0x6": 600.0
        }

        token_prices = {
            "0x1": 1.0,
            "0x2": 2.0,
            "0x3": 3.0,
            "0x4": 4.0,
            "0x5": 5.0,
            "0x6": 6.0
        }

        result = suggest_token_quantities(
            token_balances=token_balances,
            target_usd_amount=1_000_000,
            token_prices=token_prices,
            diversity_factor=0.15
        )

        assert isinstance(result, dict)
        assert not result


def test_suggest_token_quantities_empty():
    # Test with empty balances
    result = suggest_token_quantities({}, 1000000, {})
    assert result == {}

    # Test with missing price data
    result = suggest_token_quantities({"0x1": 100.0}, 1000000, {})
    assert result == {}


def test_suggest_token_quantities_diversity():
    token_balances = {
        "0x1": 113.559,
        "0x2": 214.667,
        "0x3": 343.584
    }
    token_prices = {
        "0x1": 1.0,
        "0x2": 2.0,
        "0x3": 3.0
    }

    result = suggest_token_quantities(
        token_balances=token_balances,
        target_usd_amount=500_000_000,  # $500
        token_prices=token_prices,
        diversity_factor=0.7
    )
    LOGGER.info("recommended quantities %s", result)

    # Check we don't exceed diversity factor
    for token, qty in result.items():
        assert qty <= token_balances[token] * 0.7
