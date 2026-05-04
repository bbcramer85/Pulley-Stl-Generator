import http from "node:http";
import serveHandler from "serve-handler";

const port = Number(process.env.PORT) || 4173;
const host = "0.0.0.0";

const server = http.createServer((request, response) => {
  return serveHandler(request, response, {
    public: "dist",
    cleanUrls: true,
  });
});

server.listen(port, host, () => {
  console.log(`Mechanical STL Generator listening on ${host}:${port}`);
});
