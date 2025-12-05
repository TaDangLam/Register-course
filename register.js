import puppeteer from "puppeteer";
import fs from "fs";
import "dotenv/config";

export const registerCourse = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null, // full screen
	});

	const page = await browser.newPage();

	// Đọc danh sách học phần
	const courses = JSON.parse(fs.readFileSync("./courses.json", "utf8")).COURSE_CODES;
	console.log("Danh sách cần đăng ký:", courses);

	console.log("🔄 Đang mở trang LOGIN...");

	// 1. Mở URL login (KHÔNG được waitForNavigation ở đây)
	await page.goto(process.env.LOGIN_URL, { waitUntil: "domcontentloaded" });

	// CTU redirect rất nhanh → chờ 1 chút cho redirect ổn định
	await page.waitForTimeout?.(2000)

	// 2. Chờ form login xuất hiện (tùy CTU có thể đổi ID)
	const usernameSelector = "#usernameUserInput";
	const passwordSelector = "#password";
	const submitSelector = "button[type='submit']";

	console.log("⏳ Chờ form login xuất hiện...");

	try {
		await page.waitForSelector(usernameSelector, { timeout: 15000 });
	} catch (err) {
		console.log("❌ Không tìm thấy form login! Kiểm tra lại LOGIN_URL trong .env");
		await browser.close();
		return;
	}

	// 3. Nhập thông tin đăng nhập
	console.log("🔑 Đang nhập MSSV & mật khẩu...");

	await page.type(usernameSelector, process.env.USERNAME, { delay: 50 });
	await page.type(passwordSelector, process.env.PASSWORD, { delay: 50 });

	// 4. Submit form login
	console.log("➡️ Gửi form login...");

	await Promise.all([
		page.click(submitSelector),
		page.waitForNavigation({ waitUntil: "networkidle2" })
	]);

	console.log("✅ Login thành công!");

	// 5. Bấm nút trên giao diện để vào trang Đăng ký học phần
	console.log("👉 Bấm nút để vào trang Đăng ký học phần...");
	await page.waitForSelector("img[onclick='gotoDKindex()']", { timeout: 15000 });
	await page.click("img[onclick='gotoDKindex()']");
	await page.waitForNavigation({ waitUntil: "networkidle2" });
	console.log("✅ Đã vào trang Đăng ký học phần!");

	await page.goto(
		"https://dkmhfe.ctu.edu.vn/dangkyhocphan/sinhvien/dangkyhocphan",
		{ waitUntil: "networkidle2" }
	);
	
  	// 6. Lặp qua từng môn trong danh sách
//   for (const item of courses) {
//     const code = item.code;
//     const group = item.group;

//     console.log(`→ Đang đăng ký môn ${code} nhóm ${group}`);

//     // ---- TODO: Bạn phải inspect HTML để biết selector đúng ----
//     // Ví dụ minh họa bên dưới, bạn sẽ đổi lại dựa trên CTU:

//     // Nhập mã môn
//     await page.type("#search", code);
//     await page.click("#btnTim");
//     await page.waitForTimeout(1000);

//     // Chọn nhóm
//     await page.select(`#select_${code}`, group);

//     // Bấm nút đăng ký
//     await page.click(`#btn_dk_${code}`);
//     console.log(`✓ Đã đăng ký môn ${code} nhóm ${group}`);
//   }

//   console.log("🎉 HOÀN THÀNH ĐĂNG KÝ TOÀN BỘ HỌC PHẦN!");
};
