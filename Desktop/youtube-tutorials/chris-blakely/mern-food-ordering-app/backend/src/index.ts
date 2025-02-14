import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test endpoints
app.get("/test", async (req: Request, res: Response) => {
  res.json({ message: "Hello!" });
});

app.listen(7000, () => {
  console.log("server started on localhost:7000");
});
