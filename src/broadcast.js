export const subscribeBroadcast = () => {
  const channel = new BroadcastChannel('share-api');
  console.log(channel);
  channel.addEventListener('message', (event) => {
    console.log(event.data);
  });

  channel.onmessage = (event) => {
    console.log(event.data);
  };

  channel.onmessage = function (ev) {
    console.log(`message event received! '${ev.data}'`);
  };
};
