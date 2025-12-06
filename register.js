import puppeteer from "puppeteer";
import fs from "fs";
import "dotenv/config";
import axios from "axios";

export const registerCourse = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null, // full screen
	});

	const page = await browser.newPage();
	
	// dialog tự động bấm ok alert
	page.on("dialog", async (dialog) => {
    	await dialog.accept();
	});

	// Đọc danh sách học phần
	const courses = JSON.parse(fs.readFileSync("./courses.json", "utf8")).data;
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

	await page.type(usernameSelector, process.env.CTU_USERNAME, { delay: 50 });
	await page.type(passwordSelector, process.env.CTU_PASSWORD, { delay: 50 });

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

	await page.goto(
		"https://dkmhfe.ctu.edu.vn/dangkyhocphan/sinhvien/dangkyhocphan",
		{ waitUntil: "networkidle2" }
	);

	// Lấy danh sách cookie
	const cookies = await page.cookies();
	// Tìm cookie access_token
	const accessTokenCookie = cookies.find(c => c.name === "access_token");
	if (!accessTokenCookie) {
		console.log("❌ Không tìm thấy access_token sau gotoDKindex()");
		await browser.close();
		return;
	}
	const token = accessTokenCookie.value;

	console.log("✅ Đã vào trang Đăng ký học phần!");

  	// 6. Lặp qua từng môn trong danh sách
	await page.evaluate(() => {
        alert("Đang đăng ký học phần...");
    });
	for (const item of courses) {
		const code = item.dkmh_tu_dien_hoc_phan_ma;
		const group = item.dkmh_nhom_hoc_phan_ma;
		
		console.log(`➡️ Đang đăng ký: ${code} - nhóm ${group}`);

		const body = {
			data: [
				{
					dkmh_tu_dien_hoc_phan_ma: code,
					dkmh_nhom_hoc_phan_ma: group
				}
			]
		};

		try {
			const res = await axios.post(process.env.apiURL, body, {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});

			console.log(`✅ Đăng ký thành công ${code} nhóm ${group}`);

		} catch (err) {
			console.log(`❌ Lỗi khi đăng ký môn ${code} nhóm ${group}`);
			if (err.response) {
				console.log("⚠️ API trả về:", err.response.data);
			} else {
				console.log("⚠️ Lỗi khác:", err.message);
			}
		}

		await new Promise(r => setTimeout(r, 500)); // pause nhẹ
	}

  	console.log("🎉 HOÀN THÀNH ĐĂNG KÝ TOÀN BỘ HỌC PHẦN!");
	await page.evaluate(() => {
        alert("Đăng ký học phần thành công! Trang sẽ reload lại.");
        location.reload();
    });
};
