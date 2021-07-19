const API_KEY =
  'e3814f2daab5f6b6459a22b40ebaca4163cc25285103dea510a9bb8419812bbc';

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const bChannel = new BroadcastChannel('WebSocketChannel');
const idToPortMap = {};

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
    bChannel.postMessage({
      type: 'WSState',
      state: socket.readyState
    });
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

function subscribeToCoinWS(coinName) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${coinName}~USD`]
  });
}

socket.onmessage = ({ data }) => {
  console.log(data);
  // Construct object to be passed
  const parsedData = {
    data: JSON.parse(data),
    type: 'message'
  };
  if (!parsedData.data.from) {
    // Broadcast to all contexts(tabs)
    bChannel.postMessage(parsedData);
  } else {
    // Get the port to post to using
    // uuid, ie send to expected tab.
    idToPortMap[parsedData.data.from].postMessage(parsedData);
  }
};

// onconnect = (e) => {
//   // Get the MessagePort from the event.
//   // This will be the
//   // communication channel between
//   // SharedWorker and the Tab
//   const port = e.ports[0];
//   port.onmessage = (msg) => {
//     // Collect port information in the map
//     idToPortMap[msg.data.from] = port;

//     // Forward this message to
//     // ws connection.
//     socket.send(
//       JSON.stringify({
//         data: msg.data
//       })
//     );
//   };
//   // We need this to notify the
//   // newly connected context to know
//   // the current state of WS connection.
//   port.postMessage({
//     state: socket.readyState,
//     type: 'WSState'
//   });
// };

function unsubscribeFromCoinWS(coinName) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${coinName}~USD`]
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
