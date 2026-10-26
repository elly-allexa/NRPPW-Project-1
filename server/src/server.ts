import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000); 

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

//to check connection with React
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Hello from server!"
  });
});

app.use((_req, res) => {
    res.status(404).json({
        status: "error",
        message: "404 Not Found"
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server:  http://localhost:${port}`);
});