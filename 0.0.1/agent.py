import logging
import json
import re
import typing
from nearai.agents.environment import Environment, ChatCompletionMessageToolCall
from src.utils import (
    fetch_coinbase,
    fetch_coingecko,
    get_recommended_token_allocations,
    get_near_account_balance,
)

USD_PORTFOLIO_GOAL_REGEX = re.compile(r"portfolio:\s*(\d+)")
USD_ALLOWANCE_GOAL_REGEX = re.compile(r"allowance:\s*(\d+)")


class Agent:

    def __init__(self, env: Environment):
        self.env = env
        self.growth_goal = None
        self.allowance_goal = None
        self.prices = None
        self.recommended_tokens = None
        self.near_account_id = "ptke.near"
        self.near_account_balance = None
        tool_registry = self.env.get_tool_registry()
        tool_registry.register_tool(
            self.recommend_token_allocations_to_swap_for_stablecoins
        )
        tool_registry.register_tool(self.get_allowance_goal)
        tool_registry.register_tool(self.find_near_account_id)
        tool_registry.register_tool(self.find_foo_id)

    def find_growth_goal(self, chat_history):
        for message in reversed(chat_history):
            match = USD_PORTFOLIO_GOAL_REGEX.match(message["content"])
            if message["role"] == "user" and match:
                return match.group(1)
        return ""

    def find_allowance_goal(self, chat_history):
        for message in reversed(chat_history):
            match = USD_ALLOWANCE_GOAL_REGEX.match(message["content"])
            if message["role"] == "user" and match:
                return match.group(1)
        return ""

    def get_last_search_term(self, chat_history):
        for message in reversed(chat_history):
            if message["role"] == "user":
                return message["content"]
        return ""

    def run(self):
        # A system message guides an agent to solve specific tasks.
        prompt = {
            "role": "system",
            "content": """You are an assistant that helps people set goals for growth in the USD value of their crypto assets
            such that when that percentage in growth has been reached or surpassed, you look at their tokens and
            determine the tokens and quantities of each to swap for USDT stablecoins or USDC stablecoins.
            You also have access to some auxiliary info about their wallets and accounts""",
        }

        # Use the model set in the metadata to generate a response
        # result = self.env.completion([prompt] + self.env.list_messages())
        tools = self.env.get_tool_registry().get_all_tool_definitions()
        res = self.env.completion_and_get_tools_calls(
            [prompt] + [self.env.get_last_message() or ""], tools=tools
        )
        self.env.add_system_log(f"Should call tools: {res.tool_calls}", logging.DEBUG)

        if res.message:
            self.env.add_reply(res.message)
        if res.tool_calls and len(res.tool_calls) > 0:
            tool_call_results = self._handle_tool_calls(res.tool_calls)
            if len(tool_call_results) > 0:
                self.env.add_system_log(
                    f"Got tool call results: {tool_call_results}", logging.DEBUG
                )
                result = self.env.completion(
                    [prompt] + self.env.list_messages() + tool_call_results
                )

        chat_history = self.env.list_messages()
        last_user_query = self.get_last_search_term(chat_history)
        if (
            last_user_query == "recommend swaps"
            or last_user_query == "suggest tokens to swap"
        ):
            result = self.recommend_token_allocations_to_swap_for_stablecoins()
        elif last_user_query == "show allowance goal":
            result = self.get_allowance_goal()
        elif last_user_query == "show growth goal":
            result = self.get_growth_goal()
        elif last_user_query == "fetch prices":
            result = self.fetch_token_prices()

        self.env.add_reply(result)

        # Give the prompt back to the user
        self.env.request_user_input()

    def find_near_account_id(self):
        """Save the NEAR account ID of the user from chat history format 'near: <account_id>'"""
        if not self.near_account_id:
            for message in reversed(self.env.list_messages()):
                if message["role"] == "user" and message["content"].startswith("near:"):
                    self.near_account_id = message["content"].split("near:")[1].strip()
                    self.env.add_reply(
                        f"Saving your NEAR account ID: {self.near_account_id}"
                    )
        return self.near_account_id

    def find_foo_id(self):
        """Fetch the user's foo ID"""
        return "foobar:123456"

    def fetch_token_prices(self):
        """Fetch the current prices of the tokens"""
        print("Fetching the current prices of the tokens in your wallet...")
        self.find_near_account_id()
        balance = get_near_account_balance(self.near_account_id)
        if balance:
            if len(balance) > 23:
                length = len(balance)
                chars_remaining = length - 23
                # TODO improve the yocoto to Near conversion
                self.near_account_balance = float(
                    str(balance[0 : chars_remaining - 1])
                    + "."
                    + "".join(balance[chars_remaining - 1 : length])
                )

        print(f"Found NEAR balance: {self.near_account_balance}")
        near_price = fetch_coinbase("near")
        near_price = (
            fetch_coingecko("near") if isinstance(near_price, bool) else near_price
        )

        btc_price = fetch_coinbase("btc")
        btc_price = fetch_coingecko("btc") if isinstance(btc_price, bool) else btc_price

        eth_price = fetch_coinbase("eth")
        eth_price = fetch_coingecko("eth") if isinstance(eth_price, bool) else eth_price

        sol_price = fetch_coinbase("sol")
        sol_price = fetch_coingecko("sol") if isinstance(sol_price, bool) else sol_price
        self.prices = [
            "NEAR:",
            near_price,
            "BTC:",
            btc_price,
            "ETH:",
            eth_price,
            "SOL:",
            sol_price,
        ]

        self.env.add_reply(
            "Fetching the current prices of the tokens in your wallet..."
        )
        return str(
            self.prices + [f" Near account balance: {self.near_account_balance}"]
        )

    def get_growth_goal(self):
        """Given user prompts referring to portfolio growth, token growth, find their USD growth goal"""
        chat_history = self.env.list_messages()
        growth_goal = self.find_growth_goal(chat_history)
        if not self.growth_goal and growth_goal:
            self.growth_goal = growth_goal
        return self.growth_goal

    def get_allowance_goal(self):
        """Given user prompts referring to goals, goal, usd, allowance, and target, find the allowance goal"""
        chat_history = self.env.list_messages()

        allowance_goal = self.find_allowance_goal(chat_history)
        if not self.allowance_goal and allowance_goal:
            self.allowance_goal = allowance_goal
        return self.allowance_goal

    def _handle_tool_calls(
        self, tool_calls: typing.List[ChatCompletionMessageToolCall]
    ) -> typing.List[typing.Dict]:
        """Execute the tool calls and return the results"""
        results = []
        for tool_call in tool_calls:
            # exec_command tool call seems to be for executing commands on the Terminal? probably should be deregistered
            if tool_call.function.name == "exec_command":
                continue
            tool = self.env.get_tool_registry().get_tool(tool_call.function.name)
            if not tool:
                self.env.add_system_log(
                    f"Tool '{tool_call.function.name}' not found in the tool registry.",
                    logging.WARNING,
                )
                continue
            args = json.loads(tool_call.function.arguments)
            results.append(
                {
                    "role": "function",
                    "name": tool_call.function.name,
                    "content": json.dumps(tool(**args)),
                }
            )
        return results

    def recommend_token_allocations_to_swap_for_stablecoins(self):
        """Given a input of a target USD amount, recommend the tokens and quantities of each to swap for USDT stablecoins or USDC stablecoins"""
        if not self.recommended_tokens:
            self.env.add_reply(
                f"Considering your options with a preference for holding BTC..."
            )
            self.get_allowance_goal()
            self.recommended_tokens = get_recommended_token_allocations(
                int(self.allowance_goal)
            )

        self.env.add_reply(
            f"We can sell this quantity of your tokens to realize your target USD in stablecoin..."
        )
        return str(self.recommended_tokens) if self.recommended_tokens else ""


if globals().get("env", None):
    env = globals().get("env", {})
    agent = Agent(env)
    agent.run()
