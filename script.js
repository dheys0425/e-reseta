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

  // ---------- Medicine categories (names only — doctor fills dosage/frequency/duration) ----------
  const MEDICINE_CATEGORIES = {
    "Heart / Cardiovascular": [
      "Amlodipine", "Losartan", "Metoprolol", "Atorvastatin", "Clopidogrel",
      "Aspirin (low-dose)", "Furosemide", "Digoxin", "Isosorbide Dinitrate", "Carvedilol"
    ],
    "Kidney / Renal": [
      "Furosemide", "Sodium Bicarbonate", "Calcium Carbonate", "Losartan",
      "Amlodipine", "Spironolactone", "Ferrous Sulfate", "Erythropoietin"
    ],
    "Diabetes / Endocrine": [
      "Metformin", "Glimepiride", "Gliclazide", "Insulin (Regular)",
      "Insulin (NPH)", "Sitagliptin", "Levothyroxine"
    ],
    "Respiratory": [
      "Salbutamol", "Budesonide", "Montelukast", "Prednisone",
      "Azithromycin", "Ambroxol", "Carbocisteine"
    ],
    "Gastrointestinal": [
      "Omeprazole", "Ranitidine", "Domperidone", "Loperamide",
      "Metoclopramide", "Lactulose"
    ],
    "Antibiotics": [
      "Amoxicillin", "Amoxicillin-Clavulanate", "Cephalexin",
      "Azithromycin", "Ciprofloxacin", "Metronidazole"
    ],
    "Pain / Anti-inflammatory": [
      "Paracetamol", "Ibuprofen", "Mefenamic Acid", "Celecoxib", "Tramadol"
    ],
    "Neuro / Psych": [
      "Amitriptyline", "Sertraline", "Gabapentin", "Diazepam", "Citalopram"
    ],
    "Vitamins / Supplements": [
      "Multivitamins", "Ferrous Sulfate", "Folic Acid", "Vitamin B Complex", "Calcium + Vitamin D"
    ]
  };

  // Tracks which checked medicine name maps to which row element
  const checkedMedRows = new Map();

  function renderCategoryTabs() {
    const tabsEl = $("catTabs");
    const names = Object.keys(MEDICINE_CATEGORIES);

    tabsEl.innerHTML = "";
    names.forEach((cat, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "cat-tab" + (i === 0 ? " active" : "");
      tab.textContent = cat;
      tab.dataset.cat = cat;
      tab.addEventListener("click", () => {
        tabsEl.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderCategoryPanel(cat);
      });
      tabsEl.appendChild(tab);
    });

    renderCategoryPanel(names[0]);
  }

  function renderCategoryPanel(cat) {
    const panelEl = $("catPanel");
    panelEl.innerHTML = "";
    MEDICINE_CATEGORIES[cat].forEach((drugName) => {
      const item = document.createElement("div");
      item.className = "cat-item";

      const checkboxId = "med_" + cat.replace(/\W+/g, "") + "_" + drugName.replace(/\W+/g, "");
      const checked = checkedMedRows.has(drugName) ? "checked" : "";

      item.innerHTML =
        '<input type="checkbox" id="' + checkboxId + '" ' + checked + '>' +
        '<label for="' + checkboxId + '">' + drugName + "</label>";

      const checkbox = item.querySelector("input");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          const row = addMedRow({ name: drugName });
          checkedMedRows.set(drugName, row);
        } else {
          const row = checkedMedRows.get(drugName);
          if (row) {
            row.remove();
            checkedMedRows.delete(drugName);
            renumberRows();
            renderPreview();
          }
        }
      });

      panelEl.appendChild(item);
    });
  }

  // ---------- Medicine rows ----------
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
      // If this row came from a checked category item, uncheck it too
      for (const [name, r] of checkedMedRows.entries()) {
        if (r === row) {
          checkedMedRows.delete(name);
          const cat = Object.keys(MEDICINE_CATEGORIES).find((c) =>
            MEDICINE_CATEGORIES[c].includes(name)
          );
          if (cat) {
            const cb = document.getElementById(
              "med_" + cat.replace(/\W+/g, "") + "_" + name.replace(/\W+/g, "")
            );
            if (cb) cb.checked = false;
          }
          break;
        }
      }
      row.remove();
      renumberRows();
      renderPreview();
    });

    row.querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", renderPreview)
    );

    renumberRows();
    renderPreview();
    return row;
  }

  function renumberRows() {
    const rows = medListEl.querySelectorAll(".med-row");
    rows.forEach((row, i) => {
      row.querySelector(".med-index").textContent = "Medicine " + (i + 1);
    });
  }

  $("addMedBtn").addEventListener("click", () => addMedRow());

  // ---------- Live preview ----------
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

    // Medicines
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

    // Notes
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

  // ---------- Persistence (clinic/doctor info only, stays on this device) ----------
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
    } catch (e) {
      /* storage unavailable — ignore */
    }
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const profile = JSON.parse(raw);
      Object.keys(profile).forEach((key) => {
        if (fields[key]) fields[key].value = profile[key];
      });
    } catch (e) {
      /* ignore */
    }
  }

  // ---------- Wire up field listeners ----------
  Object.values(fields).forEach((el) => el.addEventListener("input", renderPreview));
  fields.patientSex.addEventListener("change", renderPreview);

  // ---------- Buttons ----------
  $("printBtn").addEventListener("click", () => window.print());

  $("clearBtn").addEventListener("click", () => {
    if (!confirm("Clear the whole form? This cannot be undone.")) return;
    Object.values(fields).forEach((el) => (el.value = ""));
    medListEl.innerHTML = "";
    checkedMedRows.clear();
    $("patientDate").value = todayISO();
    renderCategoryTabs();
    renderPreview();
  });

  // ---------- Init ----------
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  loadProfile();
  fields.patientDate.value = todayISO();
  renderCategoryTabs();
  renderPreview();
})();
