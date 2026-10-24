/**
 * ============================================================
 *  KONTEN PORTOFOLIO — edit file ini saja untuk mengganti isi.
 *  Field kosong ("") atau array kosong ([]) otomatis disembunyikan.
 *  Baris bertanda TODO perlu kamu isi / periksa.
 *  Ikon tersedia: about, allocate, code, contact, dashboard, download,
 *  experience, gate, people, phone, projects, repo, skills, star, truck
 * ============================================================
 */
window.PORTFOLIO = {
  profile: {
    handle: "PRADIAZ",
    name: "Pradias Ramadhan",
    title: "Software Developer",
    focus: "Logistics operations systems",
    location: "",                          // TODO: contoh "Bogor, Indonesia"
    bio: "I build the systems that keep logistics operations moving: gate management, transport management, HR records, resource allocation, and the middleware that feeds operational dashboards. Most of my work is in Laravel and .NET, with Flutter for mobile.",
    domains: ["Gate operations", "Transport", "Human resources", "Resource allocation", "Dashboards"],
    github: "pradiaz",
    email: "pradiasramadhan06@gmail.com",
    linkedin: "https://www.linkedin.com/in/pradias-ramadhan/",
    cv: "",                                // TODO: path PDF, contoh "cv.pdf"
    photo: ""                              // TODO: foto/ilustrasi diri untuk poster About, contoh "img/me.jpg" (otomatis jadi merah-hitam)
  },

  /* rank: 1–5. group: backend | mobile | frontend (dipakai di layar About) */
  skills: [
    { name: "Laravel", lang: "PHP",        rank: 5, group: "backend",  icon: "code",
      note: "Primary framework. First choice for back-office systems, REST APIs and admin panels." },
    { name: ".NET",    lang: "C#",         rank: 5, group: "backend",  icon: "dashboard",
      note: "Backend stack for services, integrations and enterprise systems." },
    { name: "Flutter", lang: "Dart",       rank: 4, group: "mobile",   icon: "phone",
      note: "Cross-platform mobile apps for field and operational users." },
    { name: "React",   lang: "JavaScript", rank: 4, group: "frontend", icon: "skills",
      note: "Component-based frontends and interactive pages." },
    { name: "Vue",     lang: "JavaScript", rank: 4, group: "frontend", icon: "star",
      note: "Reactive UI for dashboards and admin screens." }
  ],

  /* Tools di layar Equip. slot = kategori di kiri (bebas, contoh "Data", "Server", "Workflow");
     kind = label strip putih di atas nama tool (gunakan ★ sebagai pemisah).
     icon tambahan: database, server, cache, branch, send */
  tools: [
    { slot: "Data",     name: "MySQL",      kind: "Database", icon: "database", note: "Open-source relational database." },
    { slot: "Data",     name: "PostgreSQL", kind: "Database", icon: "database", note: "Open-source object-relational database." },
    { slot: "Data",     name: "SQL Server", kind: "Database", icon: "database", note: "Microsoft's relational database." },
    { slot: "Data",     name: "Redis",      kind: "Cache ★ Queue", icon: "cache",    note: "In-memory data store for caching and queues." },
    { slot: "Server",   name: "IIS",        kind: "Web server", icon: "server",   note: "Microsoft's web server for Windows hosts." },
    { slot: "Server",   name: "Apache",     kind: "Web server", icon: "server",   note: "Open-source HTTP server." },
    { slot: "Server",   name: "nginx",      kind: "Reverse proxy", icon: "server",   note: "Web server and reverse proxy." },
    { slot: "Workflow", name: "Git",        kind: "Version control", icon: "branch",   note: "Distributed version control." },
    { slot: "Workflow", name: "Postman",    kind: "API client", icon: "send",     note: "Platform for building and testing APIs." }
  ],

  /* stack: isi dengan nama skill di atas agar muncul di "Used in" pada layar Skills.
     at: nama perusahaan (sama persis dengan experience.company) agar muncul di layar Experience. */
  projects: [
    { name: "Gate Management System", short: "GMS", icon: "gate",
      domain: "Logistics · Gate operations",
      summary: "Manages gate activity for a logistics site.",   // TODO: deskripsi lengkap
      stack: [], repo: "", demo: "" },                          // TODO: stack, link
    { name: "Transport Management System", short: "TMS", icon: "truck",
      domain: "Logistics · Transport",
      summary: "Manages transport operations.",                  // TODO
      stack: [], repo: "", demo: "" },
    { name: "HRIS", short: "HRIS", icon: "people",
      domain: "Human resources",
      summary: "Human resource information system.",            // TODO
      stack: [], repo: "", demo: "" },
    { name: "RAP · Resource Allocation", short: "RAP", icon: "allocate",
      domain: "Operations planning",
      summary: "Allocates resources across operations.",         // TODO
      stack: [], repo: "", demo: "" },
    { name: "Dashboard Middleware", short: "DASH", icon: "dashboard",
      domain: "Data · Dashboards",
      summary: "Middleware that serves data to operational dashboards.", // TODO
      stack: [], repo: "", demo: "" },
    { name: "Customer Complaint System", short: "CCS", icon: "contact",
      domain: "JAPFA Group · Customer service",
      at: "PT Agrinusa Jaya Santosa (JAPFA Group)",
      summary: "System for recording and following up customer complaints.",   // TODO: detail
      stack: [], repo: "", demo: "" },
    { name: "Company Profile Website", short: "WEB", icon: "about",
      domain: "Kampung Bahasa Bloombank · Web",
      at: "Kampung Bahasa Bloombank",
      summary: "Company profile website for Kampung Bahasa Bloombank.",          // TODO: detail
      stack: [], repo: "", demo: "" }
  ],

  /* Urut dari terbaru. start/end format "YYYY-MM"; end kosong = masih bekerja.
     type tampil sebagai judul kelompok (gaya "Day Job / Night Job"). */
  experience: [
    { type: "Day Job", role: "Software Developer",
      company: "PT Tira Cipta Logistik",
      start: "2023-11", end: "",
      place: "",                   // TODO: kota
      summary: "Building logistics operations systems: GMS, TMS, HRIS, RAP and dashboard middleware.", // TODO: periksa
      stack: [] },                 // TODO
    { type: "Internship", role: "Full Stack Web Developer",
      company: "PT Agrinusa Jaya Santosa (JAPFA Group)",
      start: "2023-06", end: "2023-11",
      place: "",                   // TODO
      summary: "Built a customer complaint system.",
      stack: [] },
    { type: "Freelance", role: "Front End Web Developer",
      company: "Kampung Bahasa Bloombank",
      start: "2021-11", end: "2022-01",
      place: "",                   // TODO
      summary: "Built the company profile website.",
      stack: [] }
  ]
};
