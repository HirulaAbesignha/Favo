const http = require('http');

async function doFetch(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }, res => {
      let r = '';
      res.on('data', chunk => r+=chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: r }));
    });
    req.on('error', reject);
    if(data) req.write(data);
    req.end();
  });
}

(async () => {
   try {
     console.log("Testing POST /cart/add");
     const add1 = await doFetch("/cart/add", "POST", { user_id: 1, product_id: 201, qty: 2, price: 50 });
     console.log(add1);
     
     console.log("Testing GET /cart/1");
     const cart = await doFetch("/cart/1", "GET");
     console.log(cart.status === 200 ? "OK" : "Failed");

     console.log("Testing POST /orders/create");
     const order = await doFetch("/orders/create", "POST", { user_id: 1, cart_id: 1, delivery_method: "STANDARD" });
     console.log(order);

     const orderId = JSON.parse(order.data).orderId;
     
     console.log("Testing PUT /orders/" + orderId + "/status");
     const update = await doFetch("/orders/" + orderId + "/status", "PUT", { status: "PROCESSING" });
     console.log(update);

     console.log("Tests OK");
   } catch (e) {
     console.log("Test error", e);
   }
})();
