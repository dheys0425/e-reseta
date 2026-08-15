(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const medListEl = $("medList");
  const medRowTemplate = $("medRowTemplate");
  const pvMedList = $("pvMedList");

  const fields = {
    clinicName: $("clinicName"),
    clinicAddress: $("clinicAddress"),
    doctorName: $("doctorName"),
    doctorLicense: $("doctorLicense"),
    doctorPtr: $("doctorPtr"),
    doctorS2: $("doctorS2"),
    patientName: $("patientName"),
    patientAge: $("patientAge"),
    patientSex: $("patientSex"),
    patientDate: $("patientDate"),
    notes: $("notes"),
  };

  const STORAGE_KEY = "reseta_clinic_profile_v1";

  function addMedRow(data) {
    const frag = medRowTemplate.content.cloneNode(true);
    const row = frag.querySelector(".med-row");
    medListEl.appendChild(row);

    if (data) {
      row.querySelector(".med-name").value = data.name || "";
      row.querySelector(".med-dosage").value = data.dosage || "";
      row.querySelector(".med-frequency").value = data.frequency || "";
      row.querySelector(".med-duration").value = data.duration || "";
      row.querySelector(".med-qty").value = data.qty || "";
    }

    row.querySelector(".med-remove").addEventListener("click", () => {
      row.remove();
      renumberRows();
      renderPreview();
    });

    row.querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", renderPreview)
    );

    renumberRows();
    renderPreview();
  }

  function renumberRows() {
    const rows = medListEl.querySelectorAll(".med-row");
    rows.forEach((row, i) => {
      row.querySelector(".med-index").textContent = "Medicine " + (i + 1);
    });
  }

  $("addMedBtn").addEventListener("click", () => addMedRow());

  function renderPreview() {
    $("pvClinicName").textContent = fields.clinicName.value.trim() || "Clinic / Facility name";
    $("pvClinicAddress").textContent = fields.clinicAddress.value.trim() || "Clinic address";

    $("pvDoctorName").textContent = fields.doctorName.value.trim() || "Doctor's name";
    $("pvDoctorLicense").textContent = "PRC " + (fields.doctorLicense.value.trim() || "—");
    $("pvDoctorPtr").textContent = "PTR " + (fields.doctorPtr.value.trim() || "—");

    const s2 = fields.doctorS2.value.trim();
    if (s2) {
      $("pvS2Wrap").classList.remove("hidden");
      $("pvDoctorS2").textContent = "S2 " + s2;
    } else {
      $("pvS2Wrap").classList.add("hidden");
    }

    $("pvPatientName").textContent = fields.patientName.value.trim() || "—";
    const age = fields.patientAge.value.trim();
    const sex = fields.patientSex.value;
    $("pvPatientAgeSex").textContent =
      (age ? age + "y" : "—") + (sex ? " / " + sex : "");

    const dateVal = fields.patientDate.value;
    $("pvPatientDate").textContent = dateVal ? formatDate(dateVal) : "—";

    const rows = medListEl.querySelectorAll(".med-row");
    pvMedList.innerHTML = "";
    if (rows.length === 0) {
      pvMedList.innerHTML = '<p class="pad-empty">No medications added yet.</p>';
    } else {
      rows.forEach((row, i) => {
        const name = row.querySelector(".med-name").value.trim();
        const dosage = row.querySelector(".med-dosage").value.trim();
        const freq = row.querySelector(".med-frequency").value.trim();
        const dur = row.querySelector(".med-duration").value.trim();
        const qty = row.querySelector(".med-qty").value.trim();

        const item = document.createElement("div");
        item.className = "pad-med-item";

        const detailParts = [dosage, freq, dur].filter(Boolean);
        const detailLine = detailParts.length ? detailParts.join(" — ") : "";
        const qtyLine = qty ? "Dispense: " + qty : "";

        item.innerHTML =
          '<div class="pad-med-name">' + (i + 1) + ". " + escapeHtml(name || "(medicine name)") + "</div>" +
          (detailLine ? '<div class="pad-med-detail">' + escapeHtml(detailLine) + "</div>" : "") +
          (qtyLine ? '<div class="pad-med-detail">' + escapeHtml(qtyLine) + "</div>" : "");

        pvMedList.appendChild(item);
      });
    }

    const notes = fields.notes.value.trim();
    if (notes) {
      $("pvNotesWrap").style.display = "block";
      $("pvNotes").textContent = notes;
    } else {
      $("pvNotesWrap").style.display = "none";
    }

    saveProfile();
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function saveProfile() {
    const profile = {
      clinicName: fields.clinicName.value,
      clinicAddress: fields.clinicAddress.value,
      doctorName: fields.doctorName.value,
      doctorLicense: fields.doctorLicense.value,
      doctorPtr: fields.doctorPtr.value,
      doctorS2: fields.doctorS2.value,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {}
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const profile = JSON.parse(raw);
      Object.keys(profile).forEach((key) => {
        if (fields[key]) fields[key].value = profile[key];
      });
    } catch (e) {}
  }

  Object.values(fields).forEach((el) => el.addEventListener("input", renderPreview));
  fields.patientSex.addEventListener("change", renderPreview);

  $("printBtn").addEventListener("click", () => window.print());

  $("clearBtn").addEventListener("click", () => {
    if (!confirm("Clear the whole form? This cannot be undone.")) return;
    Object.values(fields).forEach((el) => (el.value = ""));
    medListEl.innerHTML = "";
    addMedRow();
    $("patientDate").value = todayISO();
    renderPreview();
  });

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  loadProfile();
  fields.patientDate.value = todayISO();
  addMedRow();
  renderPreview();
})();
