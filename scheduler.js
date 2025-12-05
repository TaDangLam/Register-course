import schedule from "node-schedule";
import "dotenv/config";
import { registerCourse } from "./register.js";

const runAt = new Date(process.env.RUN_AT);

console.log("Tool sẽ chạy vào:", runAt);

schedule.scheduleJob(runAt, () => {
  console.log("Đã đến giờ — chạy auto đăng ký!");
  registerCourse();
});
