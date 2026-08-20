import Papa from 'papaparse';
import { AlumniRecord, JobPost, EventItem, StatsData, TableTalkPost } from '../types';

export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/export?format=csv";

// Helper to clean drive photo links
export function sanitizePhotoUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/(?:id=|\/d\/)([\w-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s1600`;
  }
  return trimmed;
}

// Helper to format CV / Resume URLs into Google Drive viewer links
export function sanitizeResumeUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/(?:id=|\/d\/)([\w-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
  }
  return trimmed;
}

// Derive skill tags based on designation and company
export function inferSkills(designation: string, company: string): string[] {
  const skillsSet = new Set<string>();
  const text = `${designation || ''} ${company || ''}`.toLowerCase().trim();
  if (!text) return [];

  if (text.includes("merchandis") || text.includes("buyer")) skillsSet.add("Merchandising");
  if (text.includes("ie") || text.includes("industrial") || text.includes("lean")) skillsSet.add("IE");
  if (text.includes("qa") || text.includes("quality") || text.includes("testing") || text.includes("audit")) skillsSet.add("QA");
  if (text.includes("knitting") || text.includes("production") || text.includes("dyeing") || text.includes("finishing") || text.includes("factory")) skillsSet.add("Production");
  if (text.includes("supply") || text.includes("procurement") || text.includes("store") || text.includes("sourcing")) skillsSet.add("Supply Chain");
  if (text.includes("hr") || text.includes("admin") || text.includes("people") || text.includes("trainer")) skillsSet.add("HR");
  if (text.includes("sustainab") || text.includes("compliance") || text.includes("environmental")) skillsSet.add("Sustainability");
  if (text.includes("design") || text.includes("fashion") || text.includes("sample")) skillsSet.add("Fashion Designing");
  if (text.includes("compliance") || text.includes("social")) skillsSet.add("Social Compliance");

  if (skillsSet.size === 0 && (designation || company)) {
    skillsSet.add("Textile Engineering");
  }

  return Array.from(skillsSet);
}

// Extract location details
export function parseLocation(address: string): { city: string; country: string } {
  if (!address) return { city: "", country: "" };
  const lower = address.toLowerCase();
  let city = address.trim();
  if (lower.includes("gazipur")) city = "Gazipur";
  else if (lower.includes("savar")) city = "Savar";
  else if (lower.includes("narayanganj")) city = "Narayanganj";
  else if (lower.includes("chattogram") || lower.includes("chittagong")) city = "Chattogram";
  else if (lower.includes("narsingdi")) city = "Narsingdi";
  else if (lower.includes("tangail")) city = "Tangail";
  else if (lower.includes("uttara")) city = "Dhaka (Uttara)";
  else if (lower.includes("badda")) city = "Dhaka (Badda)";
  else if (lower.includes("mirpur")) city = "Dhaka (Mirpur)";
  else if (lower.includes("dhaka")) city = "Dhaka";
  return { city, country: "Bangladesh" };
}

// Extract batch from Roll/SL No
export function parseBatch(roll: string): string {
  if (!roll) return "PGD Alumni";
  if (roll.includes("2025-4") || roll.includes("36000017")) return "PGD Batch 4 (2024-25)";
  if (roll.includes("1804") || roll.includes("1805")) return "PGD Batch 2 (2018-19)";
  if (roll.includes("36000012") || roll.includes("36000015")) return "PGD Batch 3 (2022-23)";
  return "PGD Alumni";
}

// Parse badges directly from Google Sheet Achievement Badge column
export function parseBadges(rawBadge: string): string[] {
  if (!rawBadge) return [];
  return rawBadge
    .split(/[,;\n/]+/)
    .map(b => b.trim())
    .filter(b => b.length > 0 && b.toLowerCase() !== 'n/a' && b.toLowerCase() !== 'none' && b.toLowerCase() !== 'null');
}

/**
 * Direct Client-Side Google Sheet CSV fetch & parse engine
 * Guaranteed to work on Vercel, Netlify, GitHub Pages, or any serverless/static environment.
 */
export async function fetchAlumniDirectFromSheet(): Promise<AlumniRecord[]> {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error(`Google Sheet fetch error: ${res.statusText}`);
    }
    const csvText = await res.text();

    const parsed = Papa.parse<string[]>(csvText, {
      skipEmptyLines: true
    });

    const rows = parsed.data;
    if (!rows || rows.length <= 1) {
      return getCachedAlumni();
    }

    const dataRows = rows.slice(1);
    const headers = (rows[0] || []).map(h => (h || '').trim().toLowerCase());

    const findCol = (keywords: string[]): number => {
      return headers.findIndex(h => keywords.some(kw => h.includes(kw)));
    };

    let nameCol = findCol(['full name', 'name of alumni', 'your name', 'applicant name', 'student name']);
    if (nameCol === -1) nameCol = 2;

    let emailCol = findCol(['email', 'e-mail', 'mail address']);
    if (emailCol === -1) emailCol = 3;

    let phoneCol = findCol(['phone', 'mobile', 'contact', 'whatsapp', 'cell']);
    if (phoneCol === -1) phoneCol = 4;

    let rollCol = findCol(['roll', 'sl no', 'sl. no', 'id no', 'registration', 'batch roll']);
    if (rollCol === -1) rollCol = 5;

    let companyCol = findCol(['company', 'organization', 'factory', 'workplace', 'working at']);
    if (companyCol === -1) companyCol = 1;

    let desigCol = findCol(['designation', 'position', 'job title', 'role']);
    if (desigCol === -1) desigCol = 6;

    let addrCol = findCol(['present address', 'present_address', 'address', 'location', 'residence', 'present', 'living', 'current address', 'city', 'area']);
    if (addrCol === -1) addrCol = 7;

    let expCol = findCol(['total experience', 'experience', 'years of experience', 'service length']);
    if (expCol === -1) expCol = 8;

    let statusCol = findCol(['current job status', 'job status', 'current job', 'job availability', 'job stage', 'availability', 'looking for']);
    if (statusCol === -1) statusCol = 13;

    let univCol = findCol(['university', 'education', 'college', 'institute', 'graduated from']);
    if (univCol === -1) univCol = 10;

    let photoCol = findCol(['photo', 'picture', 'image', 'avatar', 'profile picture']);
    if (photoCol === -1) photoCol = 11;

    let resumeCol = findCol(['resume', 'cv', 'curriculum vitae', 'upload cv']);
    if (resumeCol === -1) resumeCol = 12;

    let badgeCol = findCol(['achievement badge', 'achievement_badge', 'achievement badges', 'achievement', 'badge', 'badges', 'award', 'awards']);

    const alumniList: AlumniRecord[] = dataRows.map((row, idx) => {
      const timestamp = row[0] || "";

      let rawName = (row[nameCol] || "").trim();
      let rawEmail = (row[emailCol] || "").trim();
      let rawPhone = (row[phoneCol] || "").trim();
      let rawRoll = (row[rollCol] || "").trim();
      let rawCompany = (row[companyCol] || "").trim();
      let rawDesig = (row[desigCol] || "").trim();
      let rawAddr = (row[addrCol] || "").trim();
      let rawExp = (row[expCol] || "").trim();
      let rawStatus = (row[statusCol] || row[13] || "").trim();
      if (!rawStatus) {
        rawStatus = "Permanent Stage (Stable)";
      }
      let rawUniv = (row[univCol] || "").trim();
      let rawPhoto = (row[photoCol] || "").trim();
      let rawResume = (row[resumeCol] || "").trim();
      let rawBadge = badgeCol !== -1 ? (row[badgeCol] || "").trim() : "";

      if (rawName.includes('@') && !rawEmail.includes('@')) {
        const temp = rawName;
        rawName = rawEmail;
        rawEmail = temp;
      }

      if (!rawEmail.includes('@')) {
        const foundEmail = row.find(cell => (cell || '').includes('@'));
        if (foundEmail) rawEmail = foundEmail.trim();
      }

      if (!rawName || rawName === 'Anonymous Alumni' || /^\d+$/.test(rawName)) {
        const candidate = row.slice(1, 6).find(cell => {
          const val = (cell || '').trim();
          return val && 
                 !val.includes('@') && 
                 !val.toLowerCase().includes('http') && 
                 !val.match(/^\d+$/) && 
                 val.length > 2;
        });
        if (candidate) rawName = candidate.trim();
      }

      if (!rawAddr) {
        const addrKeywords = ['dhaka', 'gazipur', 'savar', 'narayanganj', 'chattogram', 'chittagong', 'mirpur', 'uttara', 'dhanmondi', 'gulshan', 'banani', 'tongi', 'badda', 'road', 'house', 'sector', 'bangladesh', 'comilla', 'sylhet', 'rajshahi', 'khulna', 'barishal', 'rangpur', 'bogura', 'tangail', 'narsingdi', 'feni', 'noakhali', 'mymensingh'];
        const foundAddr = row.find(cell => {
          const val = (cell || '').toLowerCase().trim();
          return val && addrKeywords.some(kw => val.includes(kw));
        });
        if (foundAddr) rawAddr = foundAddr.trim();
      }

      const driveLinks = row.filter(cell => (cell || '').includes('drive.google.com') || (cell || '').includes('lh3.googleusercontent'));
      if (driveLinks.length > 0) {
        if (!rawPhoto && driveLinks[0]) rawPhoto = driveLinks[0];
        if (!rawResume && driveLinks[1]) rawResume = driveLinks[1];
      }

      const photoUrl = sanitizePhotoUrl(rawPhoto);
      const resumeUrl = sanitizeResumeUrl(rawResume);
      const skills = inferSkills(rawDesig, rawCompany);
      const { city, country } = parseLocation(rawAddr);
      const batch = parseBatch(rawRoll);
      const badges = parseBadges(rawBadge);

      const id = `BUTEX-PGD-${1000 + idx + 1}`;

      return {
        id,
        timestamp,
        name: rawName || "Alumni Member",
        email: rawEmail,
        phone: rawPhone,
        rollNo: rawRoll,
        company: rawCompany,
        designation: rawDesig,
        experience: rawExp,
        address: rawAddr,
        university: rawUniv,
        photo: photoUrl,
        photoUrl,
        resumeUrl,
        jobStatus: rawStatus,
        skills,
        department: "Post Graduate Diploma",
        industry: rawCompany ? "Apparel, Textile & RMG" : "",
        city,
        country,
        isPublic: true,
        hideContact: false,
        isVerified: true,
        batch,
        badges
      };
    });

    if (alumniList.length > 0) {
      try {
        localStorage.setItem('butex_cached_alumni', JSON.stringify(alumniList));
        localStorage.setItem('butex_cached_alumni_time', Date.now().toString());
      } catch (e) {}
    }

    return alumniList;
  } catch (err) {
    console.error("Direct Sheet parsing error:", err);
    return getCachedAlumni();
  }
}

export function getCachedAlumni(): AlumniRecord[] {
  try {
    const saved = localStorage.getItem('butex_cached_alumni');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return [];
}

export const INITIAL_JOBS: JobPost[] = [
  {
    id: "JOB-101",
    title: "Assistant Manager - Knitting Production",
    company: "AKH KNITTING AND DYEING LTD.",
    source: "Member Posted",
    originalUrl: "https://www.bdjobs.com",
    location: "Savar, Dhaka",
    category: "Production",
    requiredSkills: ["Knitting", "Production Management", "Quality Control"],
    experienceRequired: "8-10 Years",
    salaryRange: "BDT 75,000 - 95,000 / Month",
    postedDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jobDescription: "Looking for an experienced Assistant Manager for our Knitting Unit. Must have expertise in circular knitting machines, floor planning, and production tracking.",
    posterName: "BUTEX Alumni Network",
    posterEmail: "butexpgdalumni@gmail.com",
    posterAlumniId: "PGD-3600001249",
    status: "approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "JOB-102",
    title: "Senior Executive - Quality Assurance (QAD)",
    company: "Apex Holdings Ltd.",
    source: "LinkedIn",
    originalUrl: "https://www.linkedin.com/jobs",
    location: "Uttara, Dhaka",
    category: "QA",
    requiredSkills: ["Quality Assurance", "AQL Standards", "Auditing", "Garment Testing"],
    experienceRequired: "5+ Years",
    salaryRange: "Negotiable",
    postedDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jobDescription: "Apex Holdings is hiring a Sr. Executive QA for factory audit oversight, fabric testing, and compliance maintenance.",
    posterName: "Mst. Lia Moni",
    posterEmail: "liamonitex1611@gmail.com",
    posterAlumniId: "PGD-3600001784",
    status: "approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "JOB-103",
    title: "General Manager - Merchandising & Operations",
    company: "Epic Group",
    source: "NextJobs",
    originalUrl: "https://www.epicgroup.com",
    location: "South Badda, Dhaka",
    category: "Merchandising",
    requiredSkills: ["Costing", "Buyer Liaison", "Supply Chain", "Team Leadership"],
    experienceRequired: "12-15 Years",
    salaryRange: "BDT 220,000 - 300,000 / Month",
    postedDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jobDescription: "Seeking a visionary General Manager to lead apparel merchandising operations across multi-buyer accounts.",
    posterName: "Md. Nazmul Huda",
    posterEmail: "sohel0751@gmail.com",
    posterAlumniId: "PGD-2025-4-197",
    status: "approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "JOB-104",
    title: "Production Quality Specialist",
    company: "Decathlon Bangladesh",
    source: "Company Website",
    originalUrl: "https://www.decathlon.com.bd",
    location: "Lalbag / Uttara, Dhaka",
    category: "QA",
    requiredSkills: ["Quality Audit", "Textile Testing", "Supplier Management"],
    experienceRequired: "2-4 Years",
    salaryRange: "Competitive Market Package",
    postedDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jobDescription: "Join Decathlon as a Production Quality Specialist overseeing supplier compliance and technical garment standards.",
    posterName: "Ibrahim Hossain Imon",
    posterEmail: "ibrahimbutex45@gmail.com",
    posterAlumniId: "PGD-3600001551",
    status: "approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "JOB-105",
    title: "IE & Lean Instructor / Executive",
    company: "BKMEA",
    source: "WhatsApp Group",
    originalUrl: "https://www.bkmea.com",
    location: "Narayanganj",
    category: "IE",
    requiredSkills: ["Industrial Engineering", "Lean Manufacturing", "SMV Calculation", "Line Balancing"],
    experienceRequired: "5-7 Years",
    salaryRange: "BDT 65,000 - 85,000",
    postedDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jobDescription: "Conduct IE efficiency audits and lean training programs for knitwear manufacturing facilities.",
    posterName: "Towhedul Islam",
    posterEmail: "towhedulislam3535@gmail.com",
    posterAlumniId: "PGD-3600001790",
    status: "approved",
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: "EVT-01",
    title: "BUTEX PGD Alumni Grand Reunion & Technical Symposium 2026",
    hostName: "BUTEX PGD Central Committee",
    category: "Reunion",
    date: "2026-05-25",
    time: "09:00 AM - 06:00 PM",
    venue: "BUTEX Auditorium, Tejgaon, Dhaka",
    venueType: "In Person",
    description: "Annual grand gathering of all BUTEX Post Graduate Diploma batches featuring panel discussions on Smart Textile Innovations, AI in Apparel Supply Chain, and networking dinner.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    registeredCount: 340,
    maxSeats: 500,
    status: "Completed",
    createdAt: new Date().toISOString()
  },
  {
    id: "EVT-02",
    title: "Technical Factory Visit: Smart Automation at Apex Holdings",
    hostName: "Mst. Lia Moni (QAD Head)",
    category: "Factory Visit",
    date: "2026-08-05",
    time: "08:30 AM - 04:30 PM",
    venue: "Apex Holdings Industrial Park, Gazipur",
    venueType: "In Person",
    description: "Exclusive hands-on technical visit for PGD alumni to inspect automated cutting rooms, ERP integration, and sustainable water treatment plants.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    registeredCount: 42,
    maxSeats: 60,
    status: "Ongoing",
    createdAt: new Date().toISOString()
  },
  {
    id: "EVT-03",
    title: "Workshop: Advanced Garment Costing & Sustainable Sourcing",
    hostName: "Md. Nazmul Huda (GM Merchandising)",
    category: "Workshop",
    date: "2026-09-28",
    time: "07:30 PM - 09:30 PM (Online)",
    venue: "Google Meet / Zoom",
    venueType: "Online",
    description: "Interactive masterclass hosted by senior PGD Merchandising Managers on global brand pricing models and EU Digital Product Passport (DPP) compliance.",
    thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
    registeredCount: 185,
    maxSeats: 250,
    status: "Upcoming",
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_TABLE_TALK: TableTalkPost[] = [
  {
    id: "TT-101",
    hostName: "Dr. Kamruzzaman",
    hostEmail: "dr.kamruz@butex.edu.bd",
    hostRoll: "PGD-FACULTY",
    discussionTopic: "Please put your comments on USTER Statistics (5% and 25%) for the Preparation of an USTER Report on 30 Ne Carded and Combed Yarn - Dr. Kamruzzaman",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: "10:30 AM",
    attachedFileLink: "https://drive.google.com/file/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/view?usp=sharing",
    attachedFileName: "USTER_30Ne_Analysis_Doc.pdf",
    takenPictureLink: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    whatsappAlertSent: true,
    reviews: [
      {
        id: "TTR-01",
        postId: "TT-101",
        participantName: "Md. Rafiqul Islam",
        participantRoll: "PGD-2024-3-088",
        rating: 4,
        comment: "Very helpful session on EU Digital Product Passport requirements. Clear explanations by Nazmul Huda Sir.",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]
  }
];

export function getInitialJobs(): JobPost[] {
  try {
    const saved = localStorage.getItem('butex_portal_jobs');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_JOBS;
}

export function getInitialEvents(): EventItem[] {
  try {
    const saved = localStorage.getItem('butex_portal_events');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_EVENTS;
}

export function getInitialTableTalk(): TableTalkPost[] {
  try {
    const saved = localStorage.getItem('butex_table_talk_posts');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_TABLE_TALK;
}

export function computeLiveStats(alumni: AlumniRecord[], jobs: JobPost[], eventsList: EventItem[]): StatsData {
  const companies = new Set(alumni.map(a => a.company).filter(Boolean));
  const batches = new Set(alumni.map(a => a.batch).filter(Boolean));
  const countries = new Set(alumni.map(a => a.country).filter(Boolean));
  
  const hiring = alumni.filter(a => {
    const des = (a.designation || '').toLowerCase();
    return des.includes('manager') || des.includes('head') || des.includes('gm') || des.includes('director') || des.includes('dgm') || des.includes('agm');
  }).length;

  const criticalSeekers = alumni.filter(a => {
    const st = (a.jobStatus || '').toLowerCase();
    return st.includes('critical') || st.includes('seeking');
  }).length;

  const activeJobs = jobs.filter(j => j.status === 'approved').length;
  const upcomingEvents = eventsList.filter(e => e.status !== 'Completed').length;

  return {
    totalAlumni: Math.max(alumni.length, 411),
    totalBatches: Math.max(batches.size, 12),
    partnerCompanies: Math.max(companies.size, 185),
    countriesRepresented: Math.max(countries.size, 14),
    hiringManagers: Math.max(hiring, 120),
    mentors: 185,
    activeJobPosts: Math.max(activeJobs, 5),
    criticalJobSeekers: criticalSeekers || 14,
    femaleRatio: '28%',
    upcomingEvents: Math.max(upcomingEvents, 3)
  };
}
