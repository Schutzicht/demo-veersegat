// Eenmalig dummy boekingen + wachtlijst zaaien voor demonstratie. Draait synchroon
// voor de Astro module-scripts zodat /admin en /cursussen meteen "leven" tonen.
(function () {
  try {
    var SEEDED_KEY = "vg-demo-seeded-v1";
    if (localStorage.getItem(SEEDED_KEY) === "1") return;

    var now = Date.now();
    var hr = 3600000;
    var day = 86400000;

    if (!localStorage.getItem("vg-bookings-v1")) {
      localStorage.setItem("vg-bookings-v1", JSON.stringify([
        { courseId: "bahia-w30", seats: 2, ts: now - 3 * day - 4 * hr },
        { courseId: "valk-w31", seats: 1, ts: now - 5 * hr },
        { courseId: "optifun-w28", seats: 1, ts: now - day - 2 * hr },
        { courseId: "weekend-valk-mei", seats: 2, ts: now - 2 * day - 9 * hr },
        { courseId: "herfstweek-w42", seats: 1, ts: now - 4 * day },
        { courseId: "bahia-w30", seats: 1, ts: now - hr },
        { courseId: "optimist-w29", seats: 1, ts: now - 6 * hr },
        { courseId: "weekend-bahia-juni", seats: 2, ts: now - 11 * hr }
      ]));
    }

    if (!localStorage.getItem("vg-waitlist-v1")) {
      localStorage.setItem("vg-waitlist-v1", JSON.stringify([
        { courseId: "laser-w29", ts: now - 6 * day - 2 * hr },
        { courseId: "laser-w29", ts: now - 3 * day - 7 * hr },
        { courseId: "laser-w29", ts: now - day - 5 * hr },
        { courseId: "laser-w29", ts: now - 4 * hr },
        { courseId: "weekend-bahia-juni", ts: now - 2 * day - 3 * hr },
        { courseId: "optimist-w29", ts: now - 8 * hr }
      ]));
    }

    localStorage.setItem(SEEDED_KEY, "1");
  } catch (e) {
    // localStorage uit, geen probleem: pagina werkt zonder seed
  }
})();
