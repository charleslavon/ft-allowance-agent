
import re
from src.utils import fetch_coinbase, fetch_coingecko, get_recommended_token_allocations

USD_GOAL_REGEX = re.compile(r"usd:\s*(\d+)")

class Agent:

    def __init__(self, env):
        self.env = env
        self.usd_goal = None
        self.prices = None
        self.recommended_tokens = None
        tool_registry = self.env.get_tool_registry()
        tool_registry.register_tool(self.recommend_token_allocations_to_swap_for_stablecoins)
        tool_registry.register_tool(self.get_allowance_goal)


    def find_usd_goal(self, chat_history):
        for message in reversed(chat_history):
            match = USD_GOAL_REGEX.match(message['content'])
            if message['role'] == 'user' and match:
                return match.group(1)
        return ''

    def get_last_search_term(self, chat_history):
            for message in reversed(chat_history):
                if message['role'] == 'user':
                    return message['content']
            return ''

    def run(self):
        # A system message guides an agent to solve specific tasks.
        prompt = {"role": "system", "content": "You are an assistant that helps people set goals for growth in the USD value of their crypto assets such that when that percentage in growth has been reached or surpassed, you look at their tokens and determine the tokens and quantities of each to swap for USDT stablecoins or USDC stablecoins"}

        # Use the model set in the metadata to generate a response
        result = self.env.completion([prompt] + self.env.list_messages())

        chat_history = self.env.list_messages()
        last_user_query = self.get_last_search_term(chat_history)
        if last_user_query == "recommend swaps" or last_user_query == "suggest tokens to swap":
          result = self.recommend_token_allocations_to_swap_for_stablecoins()
        elif last_user_query == "show allowance goal":
          result = self.get_allowance_goal()
        elif last_user_query == "fetch prices":
          result = self.fetch_token_prices()

        self.env.add_reply(result)

        # Give the prompt back to the user
        self.env.request_user_input()


    def fetch_token_prices(self):
        """Fetch the current prices of the tokens"""
        print("Fetching the current prices of the tokens in your wallet...")
        near_price = fetch_coinbase("near")
        near_price = fetch_coingecko("near") if isinstance(near_price, bool) else near_price

        btc_price = fetch_coinbase("btc")
        btc_price = fetch_coingecko("btc") if isinstance(btc_price, bool) else btc_price

        eth_price = fetch_coinbase("eth")
        eth_price = fetch_coingecko("eth") if isinstance(eth_price, bool) else eth_price

        sol_price = fetch_coinbase("sol")
        sol_price = fetch_coingecko("sol") if isinstance(sol_price, bool) else sol_price
        self.prices = ["NEAR:", near_price, "BTC:", btc_price, "ETH:", eth_price, "SOL:", sol_price]

        self.env.add_reply("Fetching the current prices of the tokens in your wallet...")
        return str(self.prices)

    def get_allowance_goal(self):
        """Given user prompts referring to goals, goal, usd, allowance, and target, find the allowance goal"""
        chat_history = self.env.list_messages()
        usd_goal = self.find_usd_goal(chat_history)
        if not self.usd_goal and usd_goal:
            self.usd_goal = usd_goal
        return self.usd_goal


    def recommend_token_allocations_to_swap_for_stablecoins(self):
        """Given a input of a target USD amount, recommend the tokens and quantities of each to swap for USDT stablecoins or USDC stablecoins"""
        if not self.recommended_tokens:
            self.env.add_reply(f"Considering your options with a preference for holding BTC...")
            self.get_allowance_goal()
            self.recommended_tokens = get_recommended_token_allocations(int(self.usd_goal))

        self.env.add_reply(f"We can sell this quantity of your tokens to realize your target USD in stablecoin...")
        return str(self.recommended_tokens) if self.recommended_tokens else ""

if globals().get('env', None):
    agent = Agent(globals().get('env', {}))
    agent.run()
