const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const proxy = httpProxy.createProxy();

const BASE_URI = "https://vercel-123.s3.ap-south-1.amazonaws.com/";

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  const resolvesTo = `${BASE_URI}/${subdomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq" ,(proxy , req, res)=>{
  const url = req.url;
  if(url === "/"){
    proxy.path += "index.html"
  }
})

app.listen(8000, () => console.log("server running"));
