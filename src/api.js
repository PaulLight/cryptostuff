const API_KEY =
  'e3814f2daab5f6b6459a22b40ebaca4163cc25285103dea510a9bb8419812bbc';

const coinsHandlers = new Map();

// TODO refactor to USE URLSearchParams
const loadCoins = () => {
  if (coinsHandlers.size === 0) {
    return;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...coinsHandlers.keys()
    ].join(',')}&tsyms=USD&api_key=${API_KEY}`
  )
    .then((response) => response.json())
    .then((rawData) => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );

      console.log(Object.entries(updatedPrices));
      console.log(Object.keys(updatedPrices));

      Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const handlers = coinsHandlers.get(currency) ?? [];
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

export const subscribeToCoinUpdate = (coin, cb) => {
  const subscribers = coinsHandlers.get(coin) || [];
  coinsHandlers.set(coin, [...subscribers, cb]);
};

export const unsubscribeToCoinUpdate = (coin, cb) => {
  const subscribers = coinsHandlers.get(coin) || [];
  coinsHandlers.set(
    coin,
    subscribers.filter((fn) => fn !== cb)
  );
};

setInterval(loadCoins, 5000);

window.coins = coinsHandlers;
