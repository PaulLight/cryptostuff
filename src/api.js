const API_KEY =
  'e3814f2daab5f6b6459a22b40ebaca4163cc25285103dea510a9bb8419812bbc';

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = '5';
const BASIC_COIN = 'BTC';
const BASIC_CURRENCY = 'USD';
let coinNameTemp = '';
let priceToBTC = 0;
let priceFromBTC = 0;

socket.addEventListener('message', (e) => {
  let finalPrice = 0;
  let coinAfterUpdate = '';

  const {
    TYPE: type,
    FROMSYMBOL: currentCoin,
    PRICE: newPrice,
    MESSAGE: messageType,
    TOSYMBOL: toSymbol
  } = JSON.parse(e.data);

  if (messageType === 'INVALID_SUB') {
    subscribeToCoinWS(coinNameTemp, BASIC_COIN);
    subscribeToCoinWS(BASIC_COIN, BASIC_CURRENCY);
    return;
  }

  if (!currentCoin) {
    return;
  }

  if (toSymbol === BASIC_COIN && newPrice !== undefined) {
    priceToBTC = newPrice;
  }

  if (
    currentCoin === BASIC_COIN &&
    currentCoin !== coinNameTemp &&
    newPrice !== undefined
  ) {
    priceFromBTC = newPrice;
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  if (priceToBTC !== 0 && priceFromBTC !== 0) {
    finalPrice = priceToBTC * priceFromBTC;
    coinAfterUpdate = coinNameTemp;
  } else {
    finalPrice = newPrice;
    coinAfterUpdate = currentCoin;
  }

  const handlers = coinsHandlers.get(coinAfterUpdate) ?? [];
  handlers.forEach((fn) => fn(finalPrice));
  priceToBTC = 0;
  priceFromBTC = 0;
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

function subscribeToCoinWS(coinName, coindCurrencyTo = BASIC_CURRENCY) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`${AGGREGATE_INDEX}~CCCAGG~${coinName}~${coindCurrencyTo}`]
  });
}

function unsubscribeFromCoinWS(coinName, coindCurrencyTo = BASIC_CURRENCY) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`${AGGREGATE_INDEX}~CCCAGG~${coinName}~${coindCurrencyTo}`]
  });
}

export const subscribeToCoinUpdate = (coin, cb) => {
  coinNameTemp = coin;
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
