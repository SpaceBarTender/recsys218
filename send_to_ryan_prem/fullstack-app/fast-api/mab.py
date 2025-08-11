# mab_hellinger.py
"""
A Python module implementing Hellinger-UCB for Bernoulli bandits.

Exported functions:
  1) hellinger_squared(p, q)
  2) find_hellinger_ucb(p_hat, alpha, tol=1e-6)
  3) get_hellinger_ucb(N, S, t, c)
  4) rank_articles_hellinger_ucb(article_ids, stats, t, c)

Usage:
  from mab_hellinger import (
      hellinger_squared,
      find_hellinger_ucb,
      get_hellinger_ucb,
      rank_articles_hellinger_ucb
  )
"""

import math


def hellinger_squared(p: float, q: float) -> float:
    """
    Compute the squared Hellinger distance for two Bernoulli parameters p and q:
      H^2(Bernoulli(p), Bernoulli(q)) = 1 - sqrt( p*q + (1-p)*(1-q) ).

    :param p: Probability of success for Bernoulli distribution #1
    :param q: Probability of success for Bernoulli distribution #2
    :return: Squared Hellinger distance
    """
    # return 1.0 - math.sqrt(p*q + (1-p)*(1-q))
    p = max(0.0, min(1.0, p))
    q = max(0.0, min(1.0, q))
    term1 = math.sqrt(p * q)
    term2 = math.sqrt((1.0 - p) * (1.0 - q))
    return 1.0 - (term1 + term2)

def find_hellinger_ucb(p_hat: float, alpha: float, tol: float = 1e-6) -> float:
    """
    Binary search for the largest q in [0,1] satisfying:
      H^2( Bernoulli(p_hat), Bernoulli(q) ) <= alpha

    :param p_hat: Empirical success probability (S / N)
    :param alpha: Upper bound on H^2
    :param tol: Tolerance for stopping the binary search
    :return: The largest q in [0,1] that meets the constraint
    """
    low, high = 0.0, 1.0
    while (high - low) > tol:
        mid = 0.5 * (low + high)
        h2 = hellinger_squared(p_hat, mid)
        if h2 <= alpha:
            low = mid  # mid is feasible, push upward
        else:
            high = mid
    return low


def get_hellinger_ucb(N: int, S: int, t: float, c: float) -> float:
    """
    Compute the Hellinger-UCB for a single Bernoulli arm, given:
      - N: # times displayed (pull count)
      - S: # times clicked (success count)
      - t: 'time index' (e.g. total pulls or sum of N across all arms in that bandit)
      - c: Hyperparameter from the white paper's eq. (3.3)

    The UCB is found by computing the supremum q in [0,1] such that
       H^2(p_hat, q) <= 1 - exp(-c * (log(t + 1) / N))

    :param N: integer, pull count
    :param S: integer, success count
    :param t: float, time index (e.g. sum of pulls in the bandit)
    :param c: float, hyperparameter controlling exploration
    :return: UCB value (float in [0,1])
    """
    # Enforce constraint on c: must be between 0.25 and 0.5 inclusive
    if not (0.25 < c <= 0.5):
        raise ValueError("Parameter c must be strictly greater than 0.25 and less than or equal to 0.5")
        
    if N == 0:
        # brand new arm => maximum UCB
        return 1.0
    else:
        # Removed cold threshold logic:
        # The following block was removed:
        # elif N < cold_threshold:
        #     alpha_i = 1.0
        # else:
        #     alpha_i = 1.0 - math.exp(-c * (math.log(t + 1) / N))
        #
        # Instead, we directly compute the exploration bonus:
        alpha_i = 1.0 - math.exp(-c * (math.log(t + 1) / N))
        
    p_hat = S / N
    ucb = find_hellinger_ucb(p_hat, alpha_i)
    return ucb


def rank_articles_hellinger_ucb(article_ids, stats, t: float, c: float):
    """
    Rank a list of articles by their Hellinger-UCB in descending order.

    :param article_ids: iterable of article IDs
    :param stats: a dict-like object with {article_id: (N, S)},
                  or any DB-accessor that returns (N, S) for a given article_id
    :param t: float, the 'time index' (total pulls in the bandit)
    :param c: float, hyperparameter from eq. (3.3)
    :return: list of (article_id, ucb) sorted descending by UCB
    """
    ranked = []
    for article_id in article_ids:
        N, S = stats.get(article_id, (0, 0))
        ucb_val = get_hellinger_ucb(N, S, t, c)
        ranked.append((article_id, ucb_val))

    # Sort descending by UCB
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked





















# # --------------------------------------------------------------------
# # Example usage (only for demonstration; remove if not needed in prod)
# # --------------------------------------------------------------------
# if __name__ == "__main__":
#     # Suppose we track stats in a dict: { article_id: (N, S) }
#     # For real production code, you'd likely store in a DB or aggregator.
#     example_stats = {
#         "article_1": (3, 2),  # N=3, S=2 => p_hat=0.666...
#         "article_2": (8, 5),  # N=8, S=5 => p_hat=0.625
#         "article_3": (0, 0),  # brand-new arm
#     }
#     all_articles = ["article_1", "article_2", "article_3"]
#     t_global = sum(N for (N, _) in example_stats.values())  # total pulls so far
#     c_val = 0.5

#     # Rank all articles
#     ranked_list = rank_articles_hellinger_ucb(all_articles, example_stats, t_global, c_val)
#     print("Ranked articles by Hellinger-UCB:", ranked_list)

#     # Demonstrate updating stats after impressions
#     for (article_id, ucb_val) in ranked_list:
#         print(f"\nShowing {article_id} with UCB={ucb_val:.3f} ...")
#         # increment global time
#         t_global += 1
#         N_i, S_i = example_stats.get(article_id, (0, 0))
#         N_i += 1  # user sees it => pull
#         import random
#         click = (random.random() < 0.5)  # 50% chance
#         if click:
#             S_i += 1
#         example_stats[article_id] = (N_i, S_i)
#         print(f"New stats[{article_id}] = {example_stats[article_id]}")
