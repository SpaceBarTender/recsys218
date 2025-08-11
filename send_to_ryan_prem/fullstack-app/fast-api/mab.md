# MAB (Multi-Armed Bandit) Implementation Documentation

## Overview

The `mab.py` module implements the Hellinger-UCB algorithm for Bernoulli bandits. This algorithm is used in the article recommendation system to rank articles based on user interactions, balancing exploration and exploitation. The module provides several key functions that compute the upper confidence bound (UCB) for each article, which is then used to rank articles for personalized recommendations.

## Key Functions

### 1. `hellinger_squared(p, q)`

- **Purpose:**
  Computes the squared Hellinger distance between two Bernoulli distributions with parameters `p` and `q`.

- **Formula:**
  \[
  H^2(Bernoulli(p), Bernoulli(q)) = 1 - \sqrt{p \times q + (1-p) \times (1-q)}
  \]

- **Usage:**
  This function is a building block for measuring the divergence between the empirical success probability and a candidate probability value used in the UCB calculation.

### 2. `find_hellinger_ucb(p_hat, alpha, tol=1e-6)`

- **Purpose:**
  Uses binary search to find the largest probability `q` in the range [0, 1] such that the squared Hellinger distance between `p_hat` and `q` is within a specified upper bound `alpha`.

- **Parameters:**
  - `p_hat`: Empirical success probability (S/N).
  - `alpha`: Upper bound for the squared Hellinger distance.
  - `tol`: Tolerance for the binary search termination.

### 3. `get_hellinger_ucb(N, S, t, c, cold_threshold=5)`

- **Purpose:**
  Computes the Hellinger-UCB value for a single article (arm) using the empirical data from user interactions.

- **Parameters:**
  - `N`: Number of times the article has been displayed (pull count).
  - `S`: Number of times the article has been clicked (success count).
  - `t`: A global time index (e.g., total pulls across all articles).
  - `c`: Hyperparameter controlling the exploration factor (often set as `C_PARAM`).
  - `cold_threshold`: Minimum number of displays required to calculate a reliable UCB value. If `N` is below this threshold, the algorithm forces exploration by setting `alpha=1.0`.

- **Behavior:**
  - If `N` is 0, the function returns `1.0`, ensuring maximum exploration.
  - For `N` below `cold_threshold`, dominant exploration is enforced.
  - Otherwise, it computes `alpha_i` based on the formula \(1 - \exp\left(-c \frac{\log(t+1)}{N}\right)\) and determines the UCB.

### 4. `rank_articles_hellinger_ucb(article_ids, stats, t, c, cold_threshold=5)`

- **Purpose:**
  Ranks a list of articles in descending order based on their Hellinger-UCB values.

- **Parameters:**
  - `article_ids`: An iterable collection of article identifiers.
  - `stats`: A dictionary-like object mapping article IDs to tuples of the form `(N, S)` representing display and click counts.
  - `t`: Global time index (e.g., total pulls across the system).
  - `c`: Exploration parameter.
  - `cold_threshold`: Threshold to force exploration for new or under-explored articles.

- **Process:**
  For each article, it calls `get_hellinger_ucb` to compute the UCB value and then sorts the articles by this value in descending order.

## Relationship with `fast_api_app.py`

The functions provided in `mab.py` are directly used by the `fast_api_app.py` module, particularly in the recommendation endpoint (`/api/recommendations`). Here's how they integrate:

- **Data Collection:**
  `fast_api_app.py` gathers click and impression statistics for each article from the database. This information is organized into a dictionary where the key is the article ID and the value is a tuple `(N, S)`.

- **Ranking Execution:**
  The recommendation endpoint calls `rank_articles_hellinger_ucb`, passing the list of article IDs, the statistics dictionary, the global time index `t`, and the exploration parameter `C_PARAM`. This function returns a sorted list of articles based on their UCB values.

- **Dynamic Recommendations:**
  By continuously updating article statistics (`N` and `S`) as users interact with the content, the algorithm dynamically recalculates UCB values. This ensures that the recommendation system adapts to user behavior, promoting articles with a high potential for engagement while still exploring newer or less-interacted articles.

- **Configuration:**
  Parameters such as `C_PARAM` and `COLD_THRESHOLD` are defined in the environment configuration and are used across both `mab.py` and `fast_api_app.py` to control the behavior of the MAB algorithm.

## Usage Example in Context

In `fast_api_app.py`, you might see code similar to the following:

```python
from mab import rank_articles_hellinger_ucb

# Gather article statistics from the database
# stats_dict = { article_id: (N, S), ... }

# t is computed as the sum of all pulls
# c is set from configuration (e.g., C_PARAM = 2.0)

ranked_list = rank_articles_hellinger_ucb(article_ids, stats_dict, t, c=C_PARAM)
```

This ranking is then used to order the list of articles before they are sent back to the client as personalized recommendations.

## Final Considerations

- **Adaptability:**
  The Hellinger-UCB algorithm offers a robust way to balance exploration and exploitation, which is crucial for a dynamic recommendation system.

- **Integration:**
  The modular design in `mab.py` allows for easy updates or replacement of the ranking mechanism in `fast_api_app.py` without significant changes to the overall system architecture.

- **Scalability:**
  As the number of articles and interactions grows, the algorithm's reliance on aggregate statistics ensures that recommendations remain relevant and timely.

---

This documentation should provide a clear understanding of how the MAB module works and its critical role in the recommendation process implemented in the FastAPI backend. 