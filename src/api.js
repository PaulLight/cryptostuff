const API_KEY =
  'e3814f2daab5f6b6459a22b40ebaca4163cc25285103dea510a9bb8419812bbc';

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = '5';

socket.addEventListener('message', (e) => {
  console.log(e);
  const {
    TYPE: type,
    FROMSYMBOL: currentCoin,
    PRICE: newPrice
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = coinsHandlers.get(currentCoin) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

const coinsHandlers = new Map();

// Get Data via http request changed to Websocker, because we need real time update of data,
// this is better solution in this specific case
// const loadCoins = () => {
//   if (coinsHandlers.size === 0) {
//     return;
//   }

//   fetch(
//     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
//       ...coinsHandlers.keys()
//     ].join(',')}&tsyms=USD&api_key=${API_KEY}`
//   )
//     .then((response) => response.json())
//     .then((rawData) => {
//       const updatedPrices = Object.fromEntries(
//         Object.entries(rawData).map(([key, value]) => [key, value.USD])
//       );

//       console.log(Object.entries(updatedPrices));
//       console.log(Object.keys(updatedPrices));

//       Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//         const handlers = coinsHandlers.get(currency) ?? [];
//         handlers.forEach((fn) => fn(newPrice));
//       });
//     });
// };

function sendToWebSocket(socketMessage) {
  const message = JSON.stringify(socketMessage);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);

    return;
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(message);
    },
    { once: true }
  );
}

function subscribeToCoinWS(coinName, coindCurrencyFrom = 'USD') {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${coinName}~${coindCurrencyFrom}`]
  });
}

function unsubscribeFromCoinWS(coinName, coindCurrencyFrom = 'USD') {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${coinName}~${coindCurrencyFrom}`]
  });
}

export const subscribeToCoinUpdate = (coin, cb) => {
  const subscribers = coinsHandlers.get(coin) || [];
  coinsHandlers.set(coin, [...subscribers, cb]);
  subscribeToCoinWS(coin);
};

export const unsubscribeToCoinUpdate = (coin) => {
  unsubscribeFromCoinWS(coin);
  coinsHandlers.delete(coin);
};

// Get Data via http request changed to Websocker, because we need real time update of data,
// this is better solution in this specific case
// setInterval(loadCoins, 5000);

window.coins = coinsHandlers;


// Get price of coin wich don`t have direct converion rate to USD

// subscribeToCoinWS(coinSymbol, 'BTC');
// subscribeToCoinWS('BTC', 'USD');
