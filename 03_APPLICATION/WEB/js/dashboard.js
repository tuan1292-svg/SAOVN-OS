/*
 * =========================================================
 * SAOVN-OS DASHBOARD
 * =========================================================
 *
 * Temporary frontend session handling.
 *
 * This will later be replaced by the real
 * SAOVN-OS Authentication / Session layer.
 */


/* =========================================================
   SESSION CHECK
========================================================= */


const authenticated =
    sessionStorage.getItem(
        "saovn_demo_authenticated"
    );


if (authenticated !== "true") {

    window.location.href = "index.html";

}


/* =========================================================
   IDENTITY
========================================================= */


const identity =
    sessionStorage.getItem(
        "saovn_demo_identity"
    ) || "admin";


const displayIdentity =
    identity.charAt(0).toUpperCase() +
    identity.slice(1);


/* =========================================================
   IDENTITY UI
========================================================= */


const userIdentity =
    document.getElementById("userIdentity");


const topbarIdentity =
    document.getElementById("topbarIdentity");


const welcomeIdentity =
    document.getElementById("welcomeIdentity");


if (userIdentity) {

    userIdentity.textContent =
        displayIdentity;

}


if (topbarIdentity) {

    topbarIdentity.textContent =
        displayIdentity;

}


if (welcomeIdentity) {

    welcomeIdentity.textContent =
        displayIdentity;

}


/* =========================================================
   DATE
========================================================= */


const currentDate =
    document.getElementById("currentDate");


if (currentDate) {

    const now = new Date();


    const formatted =
        new Intl.DateTimeFormat(
            "vi-VN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        ).format(now);


    currentDate.textContent =
        formatted;

}


/* =========================================================
   LOGOUT
========================================================= */


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                "saovn_demo_authenticated"
            );

            sessionStorage.removeItem(
                "saovn_demo_identity"
            );


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   PREVENT DEAD NAVIGATION
========================================================= */


document
    .querySelectorAll(
        'a[href="#"]'
    )
    .forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

            }
        );

    });