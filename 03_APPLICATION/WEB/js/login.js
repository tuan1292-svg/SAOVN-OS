// Import Firebase Auth và biến auth đã cấu hình
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

// Lấy các phần tử trên giao diện
const loginForm = document.getElementById("loginForm");
const identityInput = document.getElementById("identity");
const passwordInput = document.getElementById("password");
const identityError = document.getElementById("identityError");
const passwordError = document.getElementById("passwordError");
const formStatus = document.getElementById("formStatus");
const loginButton = document.getElementById("loginButton");
const passwordToggle = document.getElementById("passwordToggle");

// ----------------------------------------------------------------
// 1. Tự động chuyển trang nếu đã đăng nhập từ trước
// ----------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "dashboard.html";
    }
});

// ----------------------------------------------------------------
// 2. Các hàm hỗ trợ giao diện (Xóa lỗi, Hiển thị lỗi, Bật/Tắt Loading)
// ----------------------------------------------------------------
function clearErrors() {
    identityError.textContent = "";
    passwordError.textContent = "";
    document.querySelectorAll(".form-group").forEach(group => group.classList.remove("has-error"));
    formStatus.textContent = "";
    formStatus.className = "form-status";
}

function showFormError(message) {
    formStatus.textContent = message;
    formStatus.className = "form-status visible error";
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    if (isLoading) {
        loginButton.classList.add("loading");
    } else {
        loginButton.classList.remove("loading");
    }
}

// ----------------------------------------------------------------
// 3. Xử lý nút hiện/ẩn mật khẩu (CON MẮT)
// ----------------------------------------------------------------
if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        // Đổi loại input
        passwordInput.type = isPassword ? "text" : "password";
        // Cập nhật thuộc tính aria
        passwordToggle.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
}

// ----------------------------------------------------------------
// 4. Xử lý form đăng nhập
// ----------------------------------------------------------------
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Ngăn trình duyệt reload trang
        clearErrors();

        const email = identityInput.value.trim();
        const password = passwordInput.value;

        // Xác thực cơ bản
        if (!email || !password) {
            showFormError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
            return;
        }

        setLoading(true);

        try {
            // Đăng nhập qua Firebase
            await signInWithEmailAndPassword(auth, email, password);
            // Thành công sẽ được hàm onAuthStateChanged ở trên bắt và chuyển trang
        } catch (error) {
            setLoading(false);
            // Xử lý các mã lỗi phổ biến
            switch (error.code) {
                case 'auth/invalid-email':
                    showFormError("Định dạng email không hợp lệ.");
                    break;
                case 'auth/user-disabled':
                    showFormError("Tài khoản này đã bị vô hiệu hóa.");
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    showFormError("Email hoặc mật khẩu không chính xác.");
                    break;
                case 'auth/too-many-requests':
                    showFormError("Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.");
                    break;
                default:
                    showFormError("Đã xảy ra lỗi: " + error.message);
            }
        }
    });

    // Tự động xóa thông báo lỗi khi người dùng bắt đầu gõ lại
    identityInput.addEventListener("input", clearErrors);
    passwordInput.addEventListener("input", clearErrors);
}