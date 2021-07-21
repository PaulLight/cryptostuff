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

  // updateStorageEvent();
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
    // window.addEventListener('storage', displayStorageEvent, true);
    return;
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(message);
      // window.addEventListener('storage', displayStorageEvent, true);
    },
    { once: true }
  );
}

function subscribeToCoinWS(coinName) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${coinName}~USD`]
  });
}

function unsubscribeFromCoinWS(coinName) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${coinName}~USD`]
  });
}

// // Element to display the updated data
// function displayStorageEvent(e) {
//   if (e.key == 'storage-event') {
//     console.log('displayStorageEvent');
//   }
// }
// function updateStorageEvent() {
//   localStorage.setItem('storage-event', this.value);
// }

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
