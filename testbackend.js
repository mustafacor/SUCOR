const messageModel = require("./models/messageModel");
const app = require("express")();
let messages;
app.listen(80, () => {
  console.log("Test Sunucusu Çalışıyor...");
});

app.get("/getMessages", async (req, res) => {
  messages = await messageModel.getMessages(
    req.query.from,
    req.query.to,
    req.query.page
  );
  messages = messages.map((item) => {
    return {
      from: item.gonderici,
      to: item.alici,
      content: item.icerik,
    };
  });
  res.json(messages);
});
