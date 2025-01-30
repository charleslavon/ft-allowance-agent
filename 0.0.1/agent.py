from nearai.agents.environment import Environment

def run(env: Environment):
    # A system message guides an agent to solve specific tasks.
    prompt = {"role": "system", "content": "You are a helpful assistant that helps people set goals for growth in the USD value of their crypto assets such that when that percentage in growth has been reached or surpassed, you look at their tokens and determine the tokens and quantities of each to swap for USDT stablecoins or USDC stablecoins"}

    # Use the model set in the metadata to generate a response
    result = env.completion([prompt] + env.list_messages())

    # Store the result in the chat history
    env.add_reply(result)

    # Give the prompt back to the user
    env.request_user_input()

run(env)
