// js/dashboard.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Thêm lệnh setDoc vào danh sách import
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js"; 
import { auth, db } from "./firebase-config.js";

const userIdentity = document.getElementById("userIdentity");
const topbarIdentity = document.getElementById("topbarIdentity");
const welcomeIdentity = document.getElementById("welcomeIdentity");
const logoutButton = document.getElementById("logoutButton");
const currentDate = document.getElementById("currentDate");
const userRoleText = document.querySelector(".user-info span");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            updateUI("Đang tải...", "Khởi tạo dữ liệu...");

            // 1. Kiểm tra Hồ sơ gốc (Identity)
            const identityRef = doc(db, "identities", user.uid);
            let identitySnap = await getDoc(identityRef);

            // NẾU CHƯA CÓ -> TỰ ĐỘNG TẠO MỚI (Tự sinh dữ liệu)
            if (!identitySnap.exists()) {
                await setDoc(identityRef, {
                    fullName: "Nguyễn Anh Tuấn", // Gán tên mặc định cho tài khoản đầu tiên
                    email: user.email,
                    status: "active",
                    createdAt: new Date().toISOString()
                });
                identitySnap = await getDoc(identityRef); // Đọc lại dữ liệu vừa tạo
            }

            // 2. Kiểm tra Phân quyền (Membership)
            const membershipRef = doc(db, "memberships", `mem_${user.uid}_org_saovn_01`);
            let membershipSnap = await getDoc(membershipRef);

            // NẾU CHƯA CÓ -> TỰ ĐỘNG GÁN QUYỀN ADMIN CAO NHẤT
            if (!membershipSnap.exists()) {
                await setDoc(membershipRef, {
                    identityId: user.uid,
                    organizationId: "org_saovn_01",
                    status: "active",
                    roles: {
                        system: ["system_admin"],
                        organization: ["org_member"]
                    },
                    joinedAt: new Date().toISOString()
                });
                membershipSnap = await getDoc(membershipRef);
            }

            // 3. Trích xuất và Hiển thị
            let fullName = identitySnap.data().fullName;
            let displayRole = "Thành viên";

            const roles = membershipSnap.data().roles;
            if (roles && roles.system && roles.system.includes("system_admin")) {
                displayRole = "System Administrator";
            } else if (roles && roles.organization) {
                displayRole = roles.organization[0].replace("_", " ").toUpperCase();
            }

            updateUI(fullName, displayRole);

        } catch (error) {
            console.error("Lỗi kéo dữ liệu từ Firestore:", error);
            updateUI("Lỗi dữ liệu", "Vui lòng kiểm tra kết nối");
        }
    } else {
        window.location.href = "index.html";
    }
});

function updateUI(name, roleInfo) {
    if (userIdentity) userIdentity.textContent = name;
    if (topbarIdentity) topbarIdentity.textContent = name;
    if (welcomeIdentity) welcomeIdentity.textContent = name;
    if (userRoleText) userRoleText.textContent = roleInfo;
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        signOut(auth).catch((error) => console.error("Lỗi khi đăng xuất:", error));
    });
}

if (currentDate) {
    currentDate.textContent = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    }).format(new Date());
}

document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener("click", e => e.preventDefault());
});

// ----------------------------------------------------------------
// 5. Xử lý Giao diện Bóng gương (Glassmorphism Modal)
// ----------------------------------------------------------------
const workReportModal = document.getElementById("workReportModal");
const openReportBtn = document.getElementById("openReportBtn");
const closeReportBtn = document.getElementById("closeReportBtn");

if (workReportModal && openReportBtn && closeReportBtn) {
    // Mở Modal
    openReportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        workReportModal.classList.add("active");
    });

    // Đóng bằng nút X
    closeReportBtn.addEventListener("click", () => {
        workReportModal.classList.remove("active");
    });

    // Đóng khi click ra vùng mờ xung quanh
    workReportModal.addEventListener("click", (e) => {
        if (e.target === workReportModal) {
            workReportModal.classList.remove("active");
        }
    });
}