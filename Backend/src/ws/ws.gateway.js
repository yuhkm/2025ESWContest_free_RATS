import { WebSocketServer } from "ws";
import { parse } from "url";
import { handlePrivateSocket, handlePublicSocket } from "./ws.controller.js";
import { verifyJwt } from "../utils/jwt.util.js";

export const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const { query } = parse(req.url, true);
    const token = query.token;

    // 토큰이 있으면 검증
    if (token) {
      try {
        const decoded = verifyJwt(token);
        if (decoded.payload.type !== "AT") {
          ws.close(4002, "Access Token이 아닙니다.");
          return;
        }
        ws.user = { userId: decoded.payload.userId };
      } catch (err) {
        ws.close(4004, "유효하지 않은 토큰입니다.");
        return;
      }
    }

    console.log("WebSocket 연결됨. 유저:", ws.user?.userId ?? "비인증 사용자");

    ws.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        const { type } = message;
        // 테스트 메시지일 경우 토큰 없이도 처리
        if (type === "SOCKET:TEST" || type === "DEVICE:HELLO" || type === "DRIVING:STATUS" || type === "DRIVING:STOP") {
          const response = await handlePublicSocket(message);
          const data = JSON.stringify({ status: "success", type, data: response });

          // 브로드캐스트 처리
          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(data);
            }
          });

          return;
        }

        // 테스트 메시지가 아닌데 토큰이 없으면 에러
        if (!ws.user) {
          ws.send(
            JSON.stringify({ status: "error", error: "인증이 필요합니다." })
          );
          return;
        }

        // 나머지 메시지 처리
        const response = await handlePrivateSocket(message, ws.user.userId);
        const result = JSON.stringify({ status: "success", type, data: response });

        // 브로드캐스트 처리
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(result);
          }
        });
      } catch (err) {
        ws.send(JSON.stringify({ status: "error", error: err.message }));
      }
    });
  });
};
